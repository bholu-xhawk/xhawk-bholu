import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;

describe('Users API - Mock create', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create a user and token for auth
    await request(app).post('/api/auth/signup').send({ email: 'admin@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    token = res.body.token;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test.db'); } catch {}
  });

  it('POST /api/users/mock requires auth', async () => {
    await request(app)
      .post('/api/users/mock')
      .send({ email: 'nobody@example.com', password: 'password123', name: 'No Body' })
      .expect(401);
  });

  it('POST /api/users/mock returns a mock user and does not create in DB', async () => {
    const payload = { email: 'mocked@example.com', password: 'password123', name: 'Mocked' };
    const res = await request(app)
      .post('/api/users/mock')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    // response shape
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', payload.email);
    expect(res.body).toHaveProperty('name', payload.name);
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
    expect(res.body).not.toHaveProperty('passwordHash');

    // Ensure not persisted
    const list = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const exists = Array.isArray(list.body) && list.body.some(u => u.email === payload.email);
    expect(exists).toBe(false);
  });
});
