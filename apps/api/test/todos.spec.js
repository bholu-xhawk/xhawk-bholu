import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let token2;

describe('Todos API', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    // Create two users and tokens for auth
    await request(app).post('/api/auth/signup').send({ email: 'todo_user1@example.com', password: 'password123' });
    const res1 = await request(app).post('/api/auth/login').send({ email: 'todo_user1@example.com', password: 'password123' });
    token = res1.body.token;

    await request(app).post('/api/auth/signup').send({ email: 'todo_user2@example.com', password: 'password123' });
    const res2 = await request(app).post('/api/auth/login').send({ email: 'todo_user2@example.com', password: 'password123' });
    token2 = res2.body.token;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test.db'); } catch {}
  });

  it('GET /api/todos requires auth', async () => {
    await request(app).get('/api/todos').expect(401);
  });

  it('POST /api/todos creates a todo with done=false', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'First todo', description: 'Do something' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.done).toBe(false);
  });

  it('PUT /api/todos/:id updates a todo title', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original title' })
      .expect(201);
    const id = created.body.id;

    const updated = await request(app)
      .put(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' })
      .expect(200);
    expect(updated.body.title).toBe('Updated title');
  });

  it('PATCH /api/todos/:id/done marks a todo as done', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Mark me done' })
      .expect(201);
    const id = created.body.id;

    const patched = await request(app)
      .patch(`/api/todos/${id}/done`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    expect(patched.body.done).toBe(true);
  });

  it("access control: second user cannot read or modify another user's todo", async () => {
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Private todo' })
      .expect(201);
    const id = created.body.id;

    await request(app)
      .get(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(404);

    await request(app)
      .put(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked' })
      .expect(404);

    await request(app)
      .patch(`/api/todos/${id}/done`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ done: true })
      .expect(404);
  });
});
