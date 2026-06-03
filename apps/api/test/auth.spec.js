import request from 'supertest';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Auth API', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test.db'); } catch {}
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

  it('login fails with 500 when JWT_SECRET is missing', async () => {
    const local = express();
    local.use(express.json());
    const mod = await import('../src/routes/auth.js');
    const authRouter = mod.default || mod;
    local.use('/api', authRouter);

    await request(local)
      .post('/api/auth/signup')
      .send({ email: 'no-secret@example.com', password: 'password123' })
      .expect(201);

    const prev = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const res = await request(local)
      .post('/api/auth/login')
      .send({ email: 'no-secret@example.com', password: 'password123' })
      .expect(500);
    expect(res.body).toHaveProperty('error', 'JWT_SECRET is not configured');

    process.env.JWT_SECRET = prev;
  });
});
