import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./test-auth.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;

describe('Auth API', () => {
  beforeAll(async () => {
    execSync('npm run prisma:generate && npm run prisma:push', {
      stdio: 'inherit',
      env: process.env,
    });
    const mod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = mod.default || mod;
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  afterAll(async () => {
    await prisma?.$disconnect();
    try {
      unlinkSync('./prisma/test-auth.db');
    } catch {}
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
