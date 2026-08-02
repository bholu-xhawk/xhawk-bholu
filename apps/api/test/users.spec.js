import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;

describe('Users API', () => {
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

  it('GET /api/users requires auth', async () => {
    await request(app).get('/api/users').expect(401);
  });

  it('POST /api/users creates a user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'user1@example.com', password: 'password123', name: 'User 1' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users lists users without password hashes', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'list-user@example.com', password: 'password123', name: 'List User' })
      .expect(201);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, email: 'list-user@example.com', name: 'List User' }),
      ]),
    );
    expect(res.body.find((user) => user.id === created.body.id)).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users/:id returns an existing user without password hash', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'read-user@example.com', password: 'password123', name: 'Read User' })
      .expect(201);

    const res = await request(app)
      .get(`/api/users/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({ id: created.body.id, email: 'read-user@example.com', name: 'Read User' });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users/:id for nonexistent id returns 404', async () => {
    await request(app)
      .get('/api/users/9999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('PUT /api/users/:id updates an existing user without returning password hash', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'update-user@example.com', password: 'password123', name: 'Old Name' })
      .expect(201);

    const res = await request(app)
      .put(`/api/users/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'updated-user@example.com', password: 'newpassword123', name: 'Updated Name' })
      .expect(200);

    expect(res.body).toMatchObject({ id: created.body.id, email: 'updated-user@example.com', name: 'Updated Name' });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('PUT /api/users/:id validates payload and returns 422 on invalid email', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'user2@example.com', password: 'password123' })
      .expect(201);
    const id = created.body.id;
    await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' })
      .expect(422);
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
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
    await request(app)
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
