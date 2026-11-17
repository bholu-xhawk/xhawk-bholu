import http from 'node:http';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import appModule from '../src/server.js';

const { createApp } = appModule;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

function createMemoryDestination() {
  const chunks = [];
  return {
    destination: {
      write(chunk) {
        chunks.push(String(chunk));
      },
    },
    text() {
      return chunks.join('');
    },
    records() {
      return chunks
        .join('')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    },
  };
}

function createLoggedApp(options = {}) {
  const memory = createMemoryDestination();
  const app = createApp({
    configureRoutes: options.configureRoutes,
    requestLoggerOptions: {
      destination: memory.destination,
      env: {
        NODE_ENV: 'test',
        REQUEST_LOGGING_ENABLED: 'true',
        LOG_LEVEL: 'trace',
        ...options.env,
      },
    },
  });

  return { app, memory };
}

async function eventually(assertion) {
  let lastError;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      assertion();
      return;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw lastError;
}

describe('request logging', () => {
  it('logs one successful completion with a generated response request ID', async () => {
    const { app, memory } = createLoggedApp();

    const res = await request(app).get('/api/health').expect(200, { status: 'ok' });

    expect(res.headers['x-request-id']).toMatch(REQUEST_ID_PATTERN);
    const records = memory.records();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      level: 30,
      event: 'request_completed',
      requestId: res.headers['x-request-id'],
      method: 'GET',
      route: '/api/health',
      statusCode: 200,
      aborted: false,
    });
    expect(records[0].durationMs).toEqual(expect.any(Number));
    expect(records[0].responseSize).toEqual(expect.any(Number));
  });

  it('reuses a valid inbound request ID', async () => {
    const { app, memory } = createLoggedApp();

    const res = await request(app).get('/api/health').set('X-Request-Id', 'caller-123._:abc').expect(200);

    expect(res.headers['x-request-id']).toBe('caller-123._:abc');
    expect(memory.records()[0].requestId).toBe('caller-123._:abc');
  });

  it('replaces invalid or oversized inbound request IDs', async () => {
    const { app, memory } = createLoggedApp();
    const unsafeId = `${'a'.repeat(129)} injected`;

    const res = await request(app).get('/api/health').set('X-Request-Id', unsafeId).expect(200);

    expect(res.headers['x-request-id']).not.toBe(unsafeId);
    expect(res.headers['x-request-id']).toMatch(REQUEST_ID_PATTERN);
    expect(memory.records()[0].requestId).toBe(res.headers['x-request-id']);
  });

  it('uses warn for 4xx responses and error for one correlated 5xx response', async () => {
    const { app, memory } = createLoggedApp({
      configureRoutes(app) {
        app.get('/api/not-found', (req, res) => res.status(404).json({ error: 'Not found' }));
        app.get('/api/fail', () => {
          throw new TypeError('synthetic failure');
        });
      },
    });

    await request(app).get('/api/not-found').expect(404, { error: 'Not found' });
    await request(app).get('/api/fail').expect(500, { error: 'Internal server error' });

    const records = memory.records();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ level: 40, statusCode: 404, route: '/api/not-found' });
    expect(records[1]).toMatchObject({
      level: 50,
      statusCode: 500,
      route: '/api/fail',
      err: { name: 'TypeError', message: 'synthetic failure' },
    });
    expect(records[1].err.stack).toContain('TypeError: synthetic failure');
  });

  it('logs matched route templates without query or route parameter values', async () => {
    const { app, memory } = createLoggedApp({
      configureRoutes(app) {
        app.get('/api/items/:id', (req, res) => res.json({ ok: true }));
      },
    });

    await request(app).get('/api/items/12345?search=super-secret').expect(200, { ok: true });

    const raw = memory.text();
    expect(memory.records()[0].route).toBe('/api/items/:id');
    expect(raw).not.toContain('12345');
    expect(raw).not.toContain('super-secret');
  });

  it('does not log credentials, headers, bodies, raw user agents, email addresses, or tokens', async () => {
    const { app, memory } = createLoggedApp({
      configureRoutes(app) {
        app.post('/api/safe/:token', (req, res) => res.status(201).json({ accepted: true }));
      },
    });

    await request(app)
      .post('/api/safe/route-secret?token=query-secret')
      .set('Authorization', 'Bearer header-secret')
      .set('Cookie', 'session=cookie-secret')
      .set('User-Agent', 'raw-user-agent-secret')
      .send({ email: 'person@example.com', password: 'body-secret' })
      .expect(201, { accepted: true });

    const raw = memory.text();
    expect(memory.records()[0].route).toBe('/api/safe/:token');
    expect(raw).not.toContain('route-secret');
    expect(raw).not.toContain('query-secret');
    expect(raw).not.toContain('header-secret');
    expect(raw).not.toContain('cookie-secret');
    expect(raw).not.toContain('raw-user-agent-secret');
    expect(raw).not.toContain('person@example.com');
    expect(raw).not.toContain('body-secret');
  });

  it('is disabled by default under NODE_ENV=test', async () => {
    const memory = createMemoryDestination();
    const app = createApp({
      requestLoggerOptions: {
        destination: memory.destination,
        env: { NODE_ENV: 'test' },
      },
    });

    await request(app).get('/api/health').expect(200, { status: 'ok' });

    expect(memory.records()).toHaveLength(0);
  });

  it('logs disconnected clients once as aborted warnings', async () => {
    const { app, memory } = createLoggedApp({
      configureRoutes(app) {
        app.get('/api/slow', (req, res) => {
          res.setHeader('Content-Type', 'text/plain');
          res.write('partial response');
        });
      },
    });
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();

    try {
      await new Promise((resolve, reject) => {
        const client = http.get({ port, path: '/api/slow' }, (res) => {
          res.once('data', () => {
            client.destroy();
            resolve();
          });
        });
        client.once('error', (err) => {
          if (err.code === 'ECONNRESET') resolve();
          else reject(err);
        });
      });

      await eventually(() => {
        const records = memory.records();
        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
          level: 40,
          method: 'GET',
          route: '/api/slow',
          statusCode: 200,
          aborted: true,
        });
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
