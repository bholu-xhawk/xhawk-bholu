import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:/workspace/apps/api/test-students.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let createdId;

describe('Students API (mock)', () => {
  beforeAll(async () => {
    // Use npm scripts to avoid pnpm install conflicts in CI
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env, cwd: '/workspace/apps/api' });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create a user and token for auth
    await request(app).post('/api/auth/signup').send({ email: 'student_admin@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'student_admin@example.com', password: 'password123' });
    token = res.body.token;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f /workspace/apps/api/test-students.db'); } catch {}
  });

  it('GET /api/students/1 without auth returns 401', async () => {
    await request(app)
      .get('/api/students/1')
      .expect(401);
  });

  it('POST /api/students creates a student with valid payload', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice', age: 20 })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toMatchObject({ name: 'Alice', age: 20 });
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
    createdId = res.body.id;
  });

  it('POST /api/students with invalid payload returns 422', async () => {
    await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({ age: 20 })
      .expect(422);
  });

  it('GET /api/students/:id for nonexistent id returns 404', async () => {
    await request(app)
      .get('/api/students/9999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('GET /api/students/:id returns the created student', async () => {
    const res = await request(app)
      .get(`/api/students/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: createdId, name: 'Alice', age: 20 });
  });

  it('PUT /api/students/:id with invalid payload returns 422', async () => {
    await request(app)
      .put(`/api/students/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ age: -1 })
      .expect(422);
  });

  it('PUT /api/students/:id updates fields on valid payload', async () => {
    const res = await request(app)
      .put(`/api/students/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alice B' })
      .expect(200);
    expect(res.body).toMatchObject({ id: createdId, name: 'Alice B', age: 20 });
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(new Date(res.body.createdAt).getTime());
  });

  it('DELETE /api/students/:id returns 204 and subsequent GET returns 404', async () => {
    await request(app)
      .delete(`/api/students/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get(`/api/students/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
