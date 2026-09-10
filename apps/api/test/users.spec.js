import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./test-users.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;
let token;
let adminToken;
let authUserId;

describe('Users API', () => {
  beforeAll(async () => {
    execSync('npm run prisma:generate && npm run prisma:push', {
      stdio: 'inherit',
      env: process.env,
    });
    const mod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = mod.default || mod;
    prisma = prismaMod.default || prismaMod;

    // Create a user and token for auth
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'admin@example.com', password: 'password123' });
    authUserId = signup.body.id;
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    token = res.body.token;
    adminToken = jwt.sign(
      { id: authUserId, email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET
    );
  }, 60000);

  afterAll(async () => {
    await prisma?.$disconnect();
    try {
      unlinkSync('./prisma/test-users.db');
    } catch {}
  });

  it('GET /api/users requires auth', async () => {
    await request(app).get('/api/users').expect(401);
  });

  it('POST /api/users creates a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'user1@example.com',
        password: 'password123',
        name: 'User 1',
      })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users/:id for nonexistent id returns 404', async () => {
    await request(app)
      .get('/api/users/9999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('PUT /api/users/:id validates payload and returns 422 on invalid email', async () => {
    await request(app)
      .put(`/api/users/${authUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' })
      .expect(422);
  });

  it('prevents users from accessing another user by id', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'user2@example.com', password: 'password123' })
      .expect(201);
    const id = created.body.id;

    await request(app)
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Not allowed' })
      .expect(403);
    await request(app)
      .delete(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    await request(app)
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('DELETE /api/users/:id returns 204 and subsequent GET returns 404', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'user3@example.com', password: 'password123' })
      .expect(201);
    const id = created.body.id;
    await request(app)
      .delete(`/api/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app)
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
