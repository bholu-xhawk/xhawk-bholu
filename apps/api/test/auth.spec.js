import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTestDatabase, resetTestDatabase } from './testDb.js';

process.env.JWT_SECRET = 'test-secret';

let app;
const databaseName = 'auth-test.db';

describe('Auth API', () => {
  beforeAll(async () => {
    resetTestDatabase(databaseName);
    vi.resetModules();
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  afterAll(() => {
    cleanupTestDatabase(databaseName);
  });

  it('signup succeeds with valid email/password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'a@example.com', password: 'password123', name: 'A' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('signup with duplicate email returns 422', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password123' })
      .expect(201);
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password123' })
      .expect(422);
  });

  it('login with wrong credentials returns 400', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'b@example.com', password: 'password123' })
      .expect(201);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'b@example.com', password: 'wrong' })
      .expect(400);
  });

  it('login with correct credentials returns 200 and a token', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'c@example.com', password: 'password123' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'c@example.com', password: 'password123' })
      .expect(200);
    expect(res.body).toHaveProperty('token');
  });
});
