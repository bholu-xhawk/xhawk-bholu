import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;

function removeTestDatabase() {
  for (const file of ['./prisma/test.db', './prisma/test.db-journal']) {
    try { unlinkSync(file); } catch {}
  }
}

describe('Users API', () => {
  beforeAll(async () => {
    removeTestDatabase();
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create a user and token for auth
    await request(app).post('/api/auth/signup').send({ email: 'admin@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    token = res.body.token;
  }, 60000);

  afterAll(() => {
    removeTestDatabase();
  });

  it('GET /api/users requires auth', async () => {
    await request(app).get('/api/users').expect(401);
  });

  it('GET /api/users/directory is public, paginated, ordered, and sanitized', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'directory-alpha@example.com', password: 'password123', name: 'Directory Alpha' })
      .expect(201);
    const beta = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'directory-beta@example.org', password: 'password123', name: 'Directory Beta' })
      .expect(201);
    const gamma = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'directory-gamma@example.net', password: 'password123', name: 'Directory Gamma' })
      .expect(201);

    const res = await request(app).get('/api/users/directory?page=2&page_size=2').expect(200);

    expect(res.body).toEqual({
      users: [
        { id: beta.body.id, name: 'Directory Beta', emailDomain: 'example.org' },
        { id: gamma.body.id, name: 'Directory Gamma', emailDomain: 'example.net' },
      ],
      pagination: {
        page: 2,
        page_size: 2,
        total: 4,
        total_pages: 2,
        has_next: false,
        has_prev: true,
      },
    });

    for (const user of res.body.users) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('emailDomain');
      expect(user).not.toHaveProperty('email');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('updatedAt');
    }
    expect(JSON.stringify(res.body)).not.toContain('directory-beta@example.org');
    expect(JSON.stringify(res.body)).not.toContain('directory-gamma@example.net');
  });

  it('GET /api/users/directory defaults pagination metadata', async () => {
    const res = await request(app).get('/api/users/directory').expect(200);

    expect(res.body.pagination).toMatchObject({
      page: 1,
      page_size: 10,
      has_prev: false,
    });
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(res.body.users.length);
    expect(res.body.pagination.total_pages).toBe(Math.ceil(res.body.pagination.total / 10));
  });

  it('GET /api/users/directory rejects invalid pagination', async () => {
    const invalidQueries = [
      'page=0',
      'page=-1',
      'page=1.5',
      'page=abc',
      'page_size=0',
      'page_size=-1',
      'page_size=2.5',
      'page_size=abc',
    ];

    for (const query of invalidQueries) {
      const res = await request(app).get(`/api/users/directory?${query}`).expect(400);
      expect(res.body).toEqual({ error: 'Invalid pagination parameters' });
    }
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
