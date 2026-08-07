import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;

describe('Users API', () => {
  beforeAll(async () => {
    execSync('rm -f ./test.db ./test.db-journal ./prisma/test.db ./prisma/test.db-journal');
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create a user and token for auth
    await request(app).post('/api/auth/signup').send({ email: 'admin@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    token = res.body.token;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test.db ./test.db-journal ./prisma/test.db ./prisma/test.db-journal'); } catch {}
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

  it('GET /api/users returns users ordered by id without password hashes', async () => {
    const first = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'list1@example.com', password: 'password123', name: 'List 1' })
      .expect(201);
    const second = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'list2@example.com', password: 'password123', name: 'List 2' })
      .expect(201);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids = res.body.map((user) => user.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    for (const user of res.body) {
      expect(user).toEqual(expect.objectContaining({
        id: expect.any(Number),
        email: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }));
      expect(user).not.toHaveProperty('passwordHash');
    }
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: first.body.id, email: 'list1@example.com', name: 'List 1' }),
      expect.objectContaining({ id: second.body.id, email: 'list2@example.com', name: 'List 2' }),
    ]));
  });

  it('GET /api/users/:id returns one public user', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'detail@example.com', password: 'password123', name: 'Detail User' })
      .expect(201);

    const res = await request(app)
      .get(`/api/users/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual(expect.objectContaining({
      id: created.body.id,
      email: 'detail@example.com',
      name: 'Detail User',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }));
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users/:id validates numeric positive ids', async () => {
    await request(app)
      .get('/api/users/not-a-number')
      .set('Authorization', `Bearer ${token}`)
      .expect(400, { error: 'Invalid id' });

    await request(app)
      .get('/api/users/0')
      .set('Authorization', `Bearer ${token}`)
      .expect(400, { error: 'Invalid id' });
  });

  it('GET /api/users/:id for nonexistent id returns 404', async () => {
    await request(app)
      .get('/api/users/9999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
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
