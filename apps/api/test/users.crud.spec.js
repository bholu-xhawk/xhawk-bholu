import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test-crud.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;

describe('Users CRUD API (comprehensive)', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create a user and token for auth
    await request(app).post('/api/auth/signup').send({ email: 'admin2@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin2@example.com', password: 'password123' });
    token = res.body.token;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test-crud.db'); } catch {}
  });

  it('POST /api/users creates a user (201) and returns id,email,name', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'cruduser1@example.com', password: 'password123', name: 'Crud User 1' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toMatchObject({ email: 'cruduser1@example.com', name: 'Crud User 1' });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('POST /api/users rejects duplicate email with 422', async () => {
    const dup = 'dup-crud@example.com';
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: dup, password: 'password123' })
      .expect(201);
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: dup, password: 'password123' })
      .expect(422);
  });

  it('POST /api/users validates body with 422 (bad email and short password)', async () => {
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'bademail', password: 'short' })
      .expect(422);
  });

  it('GET /api/users returns list including created user(s)', async () => {
    const email = 'list-crud@example.com';
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: 'password123', name: 'List Crud' })
      .expect(201);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(u => u.email === email)).toBe(true);
    // Ensure passwordHash is not present on items
    expect(res.body.find(u => u.email === email)).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users/:id returns a single user', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'single-crud@example.com', password: 'password123', name: 'Single Crud' })
      .expect(201);
    const id = created.body.id;
    const res = await request(app)
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.email).toBe('single-crud@example.com');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users/:id with non-existent id returns 404', async () => {
    await request(app)
      .get('/api/users/9999999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('GET /api/users/:id with invalid id returns 400', async () => {
    await request(app)
      .get('/api/users/abc')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('PUT /api/users/:id updates name/email and returns updated resource', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'put-crud-a@example.com', password: 'password123', name: 'Old Name' })
      .expect(201);
    const id = created.body.id;
    const res = await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'put-crud-a-new@example.com', name: 'New Name' })
      .expect(200);
    expect(res.body.email).toBe('put-crud-a-new@example.com');
    expect(res.body.name).toBe('New Name');
  });

  it('PUT /api/users/:id updates password (no passwordHash exposure)', async () => {
    const email = 'put-crud-pass@example.com';
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email, password: 'oldpassword', name: 'Pwd Change' })
      .expect(201);
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'newpassword123' })
      .expect(200);
    expect(res.body).not.toHaveProperty('passwordHash');

    // login with new password should succeed
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'newpassword123' })
      .expect(200);
    expect(loginRes.body).toHaveProperty('token');
  });

  it('PUT /api/users/:id with duplicate email returns 422', async () => {
    const a = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'put-crud-dup-a@example.com', password: 'password123' })
      .expect(201);
    const b = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'put-crud-dup-b@example.com', password: 'password123' })
      .expect(201);

    await request(app)
      .put(`/api/users/${b.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'put-crud-dup-a@example.com' })
      .expect(422);
  });

  it('PUT /api/users/:id with invalid id returns 400', async () => {
    await request(app)
      .put('/api/users/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' })
      .expect(400);
  });

  it('DELETE /api/users/:id returns 204 and then GET returns 404', async () => {
    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'del-crud@example.com', password: 'password123' })
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

  it('DELETE /api/users/:id with invalid id returns 400', async () => {
    await request(app)
      .delete('/api/users/abc')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('All users endpoints require Authorization header (401 without token)', async () => {
    await request(app).get('/api/users').expect(401);
    await request(app).post('/api/users').send({ email: 'noauth@example.com', password: 'password123' }).expect(401);
    await request(app).put('/api/users/1').send({ name: 'No Auth' }).expect(401);
    await request(app).delete('/api/users/1').expect(401);
  });
});
