import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emailFor = (name) => `${name}-${runId}@example.com`;

process.env.DATABASE_URL = `file:./test-${runId}.db`;
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Auth API', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  afterAll(() => {
    try { execSync(`rm -f ./prisma/test-${runId}.db ./prisma/test-${runId}.db-*`); } catch {}
  });

  it('signup succeeds with valid email/password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: emailFor('a'), password: 'password123', name: 'A' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('signup with duplicate email returns 422', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: emailFor('dup'), password: 'password123' })
      .expect(201);
    await request(app)
      .post('/api/auth/signup')
      .send({ email: emailFor('dup'), password: 'password123' })
      .expect(422);
  });

  it('login with wrong credentials returns 400', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: emailFor('b'), password: 'password123' })
      .expect(201);
    await request(app)
      .post('/api/auth/login')
      .send({ email: emailFor('b'), password: 'wrong' })
      .expect(400);
  });

  it('login with correct credentials returns 200 and a token', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: emailFor('c'), password: 'password123' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: emailFor('c'), password: 'password123' })
      .expect(200);
    expect(res.body).toHaveProperty('token');
  });
});
