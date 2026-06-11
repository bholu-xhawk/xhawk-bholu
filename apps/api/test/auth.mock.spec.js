import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Mock Auth API', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test.db'); } catch {}
  });

  it('mock signup succeeds with valid email/password and returns expected fields', async () => {
    const res = await request(app)
      .post('/api/mock/auth/signup')
      .send({ email: 'mock@example.com', password: 'password123', name: 'Mock' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email', 'mock@example.com');
    expect(res.body).toHaveProperty('name', 'Mock');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('mock login returns a token', async () => {
    const res = await request(app)
      .post('/api/mock/auth/login')
      .send({ email: 'mock@example.com', password: 'whatever' })
      .expect(200);
    expect(res.body).toHaveProperty('token');
  });

  it('mock token works with protected route', async () => {
    const login = await request(app)
      .post('/api/mock/auth/login')
      .send({ email: 'mock@example.com', password: 'whatever' })
      .expect(200);
    const token = login.body.token;

    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
