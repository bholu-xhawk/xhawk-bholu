import request from 'supertest';
import { describe, expect, it } from 'vitest';

const mod = await import('../src/server.js');
const app = mod.default || mod;

describe('Health API', () => {
  it('GET /healthz returns the liveness response', async () => {
    const res = await request(app).get('/healthz').expect(200);

    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/health preserves the existing health response', async () => {
    const res = await request(app).get('/api/health').expect(200);

    expect(res.body).toEqual({ status: 'ok' });
  });
});
