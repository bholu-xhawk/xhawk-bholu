import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;

describe('Users PATCH API (dummy)', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create a user and token for auth
    await request(app).post('/api/auth/signup').send({ email: 'patchadmin@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'patchadmin@example.com', password: 'password123' });
    token = res.body.token;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test.db'); } catch {}
  });

  it('PATCH /api/users returns dummy response', async () => {
    const body = { email: 'dummyuser@example.com', password: 'password123', name: 'Dummy User' };
    const res = await request(app)
      .patch('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(200);

    expect(res.body).toHaveProperty('dummy', true);
    expect(res.body).toHaveProperty('email', body.email);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
    expect(() => new Date(res.body.createdAt)).not.toThrow();
    expect(() => new Date(res.body.updatedAt)).not.toThrow();

    // Ensure no password related fields are present
    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('PATCH /api/users validates payload and returns 422 on short password', async () => {
    await request(app)
      .patch('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'bad@example.com', password: 'short' })
      .expect(422);
  });

  it('PATCH /api/users requires auth', async () => {
    await request(app)
      .patch('/api/users')
      .send({ email: 'noauth@example.com', password: 'password123' })
      .expect(401);
  });
});
