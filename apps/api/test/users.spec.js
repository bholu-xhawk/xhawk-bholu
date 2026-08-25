import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./users.test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let adminUser;
let directoryUser;

const testDbPath = './prisma/users.test.db';
const removeTestDb = () => {
  if (existsSync(testDbPath)) unlinkSync(testDbPath);
};

describe('Users API', () => {
  beforeAll(async () => {
    removeTestDb();
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create users and token for auth
    const adminRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'admin@example.com', password: 'password123', name: 'Admin' });
    adminUser = adminRes.body;
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    token = res.body.token;
    const directoryRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'directory.member@subdomain.example.org', password: 'password123', name: 'Directory Member' });
    directoryUser = directoryRes.body;
  }, 60000);

  afterAll(() => {
    removeTestDb();
  });

  it('GET /api/users requires auth', async () => {
    await request(app).get('/api/users').expect(401);
  });

  it('GET /api/users/directory is public and returns only safe directory fields', async () => {
    const res = await request(app)
      .get('/api/users/directory')
      .expect(200);

    expect(res.body).toEqual({
      data: [
        { id: adminUser.id, name: 'Admin', emailDomain: 'example.com' },
        { id: directoryUser.id, name: 'Directory Member', emailDomain: 'subdomain.example.org' },
      ],
      pagination: { page: 1, pageSize: 20, totalCount: 2, totalPages: 1 },
    });
    expect(res.body.data[0]).not.toHaveProperty('email');
    expect(res.body.data[0]).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users/directory paginates deterministically by ascending id', async () => {
    const res = await request(app)
      .get('/api/users/directory?page=2&pageSize=1')
      .expect(200);

    expect(res.body).toEqual({
      data: [{ id: directoryUser.id, name: 'Directory Member', emailDomain: 'subdomain.example.org' }],
      pagination: { page: 2, pageSize: 1, totalCount: 2, totalPages: 2 },
    });
  });

  it('GET /api/users/directory rejects invalid pagination values', async () => {
    await request(app).get('/api/users/directory?page=0').expect(400);
    await request(app).get('/api/users/directory?page=-1').expect(400);
    await request(app).get('/api/users/directory?page=1.5').expect(400);
    await request(app).get('/api/users/directory?pageSize=0').expect(400);
    await request(app).get('/api/users/directory?pageSize=101').expect(400);
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
