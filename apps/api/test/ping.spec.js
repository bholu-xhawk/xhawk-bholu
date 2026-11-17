import request from 'supertest';
import { describe, expect, it } from 'vitest';

const mod = await import('../src/server.js');
const app = mod.default || mod;

describe('Ping API', () => {
  it('GET /api/ping returns the ping contract', async () => {
    const res = await request(app)
      .get('/api/ping')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toEqual({ pong: true });
  });

  it('POST /api/ping falls through to the API 404 contract', async () => {
    const res = await request(app)
      .post('/api/ping')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(res.body).toEqual({ error: 'Not found' });
  });
});
