import request from 'supertest';
import { describe, expect, it } from 'vitest';
import serverModule from '../src/server.js';
import rateLimitModule from '../src/middleware/rateLimit.js';

const { createApp } = serverModule;
const { publicApiRateLimit } = rateLimitModule;

function headerNumber(res, headerName) {
  return Number(res.headers[headerName.toLowerCase()]);
}

describe('public API rate limit', () => {
  it('sets remaining and reset headers on allowed requests and the first 429', async () => {
    let now = Date.UTC(2026, 0, 1, 0, 0, 5, 500);
    const windowMs = 10_000;
    const app = createApp({
      apiRateLimit: publicApiRateLimit({
        limit: 2,
        windowMs,
        now: () => now,
        keyGenerator: (req) => req.get('x-client-id') || req.ip,
      }),
    });
    const expectedReset = Math.ceil((now - (now % windowMs) + windowMs) / 1000);

    const first = await request(app)
      .get('/api/health')
      .set('x-client-id', 'exhaustion-client')
      .expect(200);
    expect(headerNumber(first, 'x-ratelimit-remaining')).toBe(1);
    expect(headerNumber(first, 'x-ratelimit-reset')).toBe(expectedReset);
    expect(headerNumber(first, 'x-ratelimit-reset')).toBeGreaterThan(Math.floor(now / 1000));

    const finalAllowed = await request(app)
      .get('/api/health')
      .set('x-client-id', 'exhaustion-client')
      .expect(200);
    expect(headerNumber(finalAllowed, 'x-ratelimit-remaining')).toBe(0);
    expect(headerNumber(finalAllowed, 'x-ratelimit-reset')).toBe(expectedReset);

    const rejected = await request(app)
      .get('/api/health')
      .set('x-client-id', 'exhaustion-client')
      .expect(429);
    expect(rejected.body).toMatchObject({ error: 'Rate limit exceeded' });
    expect(headerNumber(rejected, 'x-ratelimit-remaining')).toBe(0);
    expect(headerNumber(rejected, 'x-ratelimit-reset')).toBe(expectedReset);
  });

  it('starts a new allowance after the fixed window reset time', async () => {
    let now = 2_000;
    const app = createApp({
      apiRateLimit: publicApiRateLimit({
        limit: 1,
        windowMs: 1_000,
        now: () => now,
        keyGenerator: (req) => req.get('x-client-id') || req.ip,
      }),
    });

    const first = await request(app)
      .get('/api/health')
      .set('x-client-id', 'reset-client')
      .expect(200);
    expect(headerNumber(first, 'x-ratelimit-remaining')).toBe(0);
    expect(headerNumber(first, 'x-ratelimit-reset')).toBe(3);

    await request(app).get('/api/health').set('x-client-id', 'reset-client').expect(429);

    now = 3_001;
    const afterReset = await request(app)
      .get('/api/health')
      .set('x-client-id', 'reset-client')
      .expect(200);
    expect(headerNumber(afterReset, 'x-ratelimit-remaining')).toBe(0);
    expect(headerNumber(afterReset, 'x-ratelimit-reset')).toBe(4);
  });

  it('adds rate-limit headers before API miss handling', async () => {
    const app = createApp({
      apiRateLimit: publicApiRateLimit({
        limit: 2,
        windowMs: 60_000,
        now: () => 10_000,
        keyGenerator: (req) => req.get('x-client-id') || req.ip,
      }),
    });

    const miss = await request(app).get('/api/missing-route').set('x-client-id', 'miss-client').expect(404);
    expect(headerNumber(miss, 'x-ratelimit-remaining')).toBe(1);
    expect(headerNumber(miss, 'x-ratelimit-reset')).toBe(60);
  });

  it('scopes quota and headers to /api routes only', async () => {
    const app = createApp({
      apiRateLimit: publicApiRateLimit({
        limit: 1,
        windowMs: 60_000,
        now: () => 10_000,
        keyGenerator: (req) => req.get('x-client-id') || req.ip,
      }),
    });

    const nonApi = await request(app).get('/').set('x-client-id', 'scope-client').expect(404);
    expect(nonApi.headers['x-ratelimit-remaining']).toBeUndefined();
    expect(nonApi.headers['x-ratelimit-reset']).toBeUndefined();

    const api = await request(app).get('/api/health').set('x-client-id', 'scope-client').expect(200);
    expect(headerNumber(api, 'x-ratelimit-remaining')).toBe(0);

    await request(app).get('/api/health').set('x-client-id', 'scope-client').expect(429);
  });
});
