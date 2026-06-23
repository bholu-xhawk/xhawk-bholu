import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Mock API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  it('GET /api/mock/user returns a mock user without auth', async () => {
    const res = await request(app).get('/api/mock/user').expect(200);
    expect(res.body).toHaveProperty('id');
    expect(typeof res.body.id).toBe('number');
    expect(res.body).toHaveProperty('name');
    expect(typeof res.body.name).toBe('string');
    expect(res.body).toHaveProperty('email');
    expect(typeof res.body.email).toBe('string');
    expect(res.body).toHaveProperty('createdAt');
    expect(typeof res.body.createdAt).toBe('string');
    // Validate createdAt is ISO-8601 parseable
    const date = new Date(res.body.createdAt);
    expect(!isNaN(date.getTime())).toBe(true);
  });
});
