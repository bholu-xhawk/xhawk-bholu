import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiDir = dirname(dirname(fileURLToPath(import.meta.url)));
const testDbPath = join(apiDir, 'prisma', 'login-rate-limit.test.db');
const originalEnv = { ...process.env };
const require = createRequire(import.meta.url);

async function loadLimiterModule() {
  const mod = await import('../src/middleware/loginRateLimit.js');
  return mod.default || mod;
}

function clearServerRequireCache() {
  for (const modulePath of [
    '../src/server.js',
    '../src/routes/auth.js',
    '../src/routes/users.js',
    '../src/middleware/loginRateLimit.js',
    '../src/prisma.js',
  ]) {
    delete require.cache[require.resolve(modulePath)];
  }
}

function makeApp(limiter, { trustProxy } = {}) {
  const app = express();
  if (trustProxy !== undefined) app.set('trust proxy', trustProxy);
  app.use(express.json());
  app.post('/api/auth/login', limiter, (req, res) => {
    res.status(req.body?.status || 200).json({ ok: true, ip: req.ip });
  });
  return app;
}

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
}

describe('createLoginRateLimiter', () => {
  let currentTime;
  let logger;
  let createLoginRateLimiter;

  beforeEach(async () => {
    vi.resetModules();
    currentTime = 1_000;
    logger = { warn: vi.fn() };
    ({ createLoginRateLimiter } = await loadLimiterModule());
  });

  it('allows five login attempts per client IP and blocks the sixth with stable headers and body', async () => {
    const app = makeApp(createLoginRateLimiter({ now: () => currentTime, logger }));

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const res = await request(app).post('/api/auth/login').send({ status: 400 }).expect(400);
      expect(res.headers['ratelimit-limit']).toBe('5');
      expect(res.headers['ratelimit-remaining']).toBe(String(5 - attempt));
      expect(res.headers['ratelimit-reset']).toBe('900');
    }

    const blocked = await request(app).post('/api/auth/login').send({ status: 200 }).expect(429);
    expect(blocked.headers['ratelimit-limit']).toBe('5');
    expect(blocked.headers['ratelimit-remaining']).toBe('0');
    expect(blocked.headers['ratelimit-reset']).toBe('900');
    expect(blocked.headers['retry-after']).toBe('900');
    expect(blocked.body).toEqual({ error: 'Too many login attempts. Please try again later.' });
    expect(logger.warn).toHaveBeenCalledWith('security.login_rate_limited', {
      route: 'POST /api/auth/login',
      retryAfterSeconds: 900,
    });
  });

  it('counts malformed, failed, and successful attempts against the same budget without success resets', async () => {
    const app = makeApp(createLoginRateLimiter({ now: () => currentTime, logger }));

    await request(app).post('/api/auth/login').send({ status: 422 }).expect(422);
    await request(app).post('/api/auth/login').send({ status: 400 }).expect(400);
    await request(app).post('/api/auth/login').send({ status: 200 }).expect(200);
    await request(app).post('/api/auth/login').send({ status: 200 }).expect(200);
    await request(app).post('/api/auth/login').send({ status: 200 }).expect(200);
    await request(app).post('/api/auth/login').send({ status: 200 }).expect(429);
  });

  it('keeps separate windows for separate client IPs', async () => {
    const app = makeApp(createLoginRateLimiter({ now: () => currentTime, logger }), { trustProxy: 1 });

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.10').expect(200);
    }
    await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.10').expect(429);
    await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.11').expect(200);
  });

  it('passes requests again after the fixed window expires', async () => {
    const app = makeApp(createLoginRateLimiter({ now: () => currentTime, logger }));

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').expect(200);
    }
    await request(app).post('/api/auth/login').expect(429);

    currentTime += 900_000;
    const res = await request(app).post('/api/auth/login').expect(200);
    expect(res.headers['ratelimit-remaining']).toBe('4');
    expect(res.headers['ratelimit-reset']).toBe('900');
  });

  it('bypasses counting and headers when disabled', async () => {
    const app = makeApp(createLoginRateLimiter({ enabled: false, now: () => currentTime, logger }));

    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post('/api/auth/login').expect(200);
      expect(res.headers['ratelimit-limit']).toBeUndefined();
      expect(res.headers['ratelimit-remaining']).toBeUndefined();
      expect(res.headers['ratelimit-reset']).toBeUndefined();
    }
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('uses whole remaining seconds in reset headers and Retry-After', async () => {
    const app = makeApp(createLoginRateLimiter({ maxRequests: 1, windowMs: 1_500, now: () => currentTime, logger }));

    const allowed = await request(app).post('/api/auth/login').expect(200);
    expect(allowed.headers['ratelimit-reset']).toBe('2');

    currentTime += 501;
    const blocked = await request(app).post('/api/auth/login').expect(429);
    expect(blocked.headers['ratelimit-reset']).toBe('1');
    expect(blocked.headers['retry-after']).toBe('1');
  });

  it('rejects malformed configuration values', async () => {
    const { loadLoginRateLimitConfig } = await loadLimiterModule();

    expect(() => loadLoginRateLimitConfig({ LOGIN_RATE_LIMIT_ENABLED: 'yes' })).toThrow(/LOGIN_RATE_LIMIT_ENABLED/);
    expect(() => loadLoginRateLimitConfig({ LOGIN_RATE_LIMIT_MAX_REQUESTS: '0' })).toThrow(/LOGIN_RATE_LIMIT_MAX_REQUESTS/);
    expect(() => loadLoginRateLimitConfig({ LOGIN_RATE_LIMIT_WINDOW_MS: '1.5' })).toThrow(/LOGIN_RATE_LIMIT_WINDOW_MS/);
  });
});

describe('login limiter on the real login route', () => {
  let prisma;

  beforeEach(() => {
    vi.resetModules();
    clearServerRequireCache();
    restoreEnv();
    process.env.DATABASE_URL = 'file:./login-rate-limit.test.db';
    process.env.JWT_SECRET = 'test-secret';
    process.env.LOGIN_RATE_LIMIT_ENABLED = 'true';
    process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS = '5';
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '900000';
    execSync('rm -f prisma/login-rate-limit.test.db prisma/login-rate-limit.test.db-journal', { cwd: apiDir });
    execSync('npm run prisma:generate && npm run prisma:push', { cwd: apiDir, stdio: 'ignore', env: process.env });
  }, 60000);

  afterEach(async () => {
    if (prisma) {
      await prisma.$disconnect();
      prisma = undefined;
    }
    execSync('rm -f prisma/login-rate-limit.test.db prisma/login-rate-limit.test.db-journal', { cwd: apiDir });
    restoreEnv();
    clearServerRequireCache();
    vi.resetModules();
  });

  function importServer() {
    clearServerRequireCache();
    const app = require('../src/server.js');
    prisma = require('../src/prisma.js');
    return app;
  }

  it('lets five malformed logins reach validation and intercepts the sixth before validation', async () => {
    const app = importServer();

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' }).expect(422);
      expect(res.body.error).toBe('Invalid input');
      expect(res.headers['ratelimit-remaining']).toBe(String(4 - i));
    }

    const blocked = await request(app).post('/api/auth/login').send({ email: 'not-an-email' }).expect(429);
    expect(blocked.body).toEqual({ error: 'Too many login attempts. Please try again later.' });
    expect(blocked.headers['ratelimit-limit']).toBe('5');
    expect(blocked.headers['ratelimit-remaining']).toBe('0');
    expect(blocked.headers['retry-after']).toBe(blocked.headers['ratelimit-reset']);
  });

  it('does not let untrusted X-Forwarded-For select the client key when proxy trust is off', async () => {
    const app = importServer();

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').set('X-Forwarded-For', `203.0.113.${i}`).send({}).expect(422);
    }
    await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.99').send({}).expect(429);
  });

  it('uses Express trusted proxy hops when configured', async () => {
    process.env.TRUST_PROXY_HOPS = '1';
    const app = importServer();

    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.20').send({}).expect(422);
    }
    await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.20').send({}).expect(429);
    await request(app).post('/api/auth/login').set('X-Forwarded-For', '203.0.113.21').send({}).expect(422);
  });

  it('bypasses the route limiter when disabled by environment', async () => {
    process.env.LOGIN_RATE_LIMIT_ENABLED = 'false';
    const app = importServer();

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app).post('/api/auth/login').send({}).expect(422);
      expect(res.headers['ratelimit-limit']).toBeUndefined();
    }
  });

  it('rejects malformed trust proxy hop configuration', async () => {
    process.env.TRUST_PROXY_HOPS = 'true';
    expect(() => importServer()).toThrow(/TRUST_PROXY_HOPS/);
  });
});
