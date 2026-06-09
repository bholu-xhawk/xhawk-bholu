import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let app;

describe('Mock User Endpoint', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  it('GET /api/user returns mock user public data', async () => {
    const res = await request(app)
      .get('/api/user')
      .expect(200);

    expect(res.body).toEqual({
      id: 1,
      email: 'mock.user@example.com',
      name: 'Mock User',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
  });
});
