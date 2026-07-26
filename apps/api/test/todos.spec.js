import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

const dbFile = `todos-${process.pid}.db`;
process.env.DATABASE_URL = `file:./${dbFile}`;
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let otherToken;

async function signupAndLogin(email) {
  const signup = await request(app).post('/api/auth/signup').send({ email, password: 'password123' });
  expect(signup.status, JSON.stringify(signup.body)).toBe(201);
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
  return res.body.token;
}

describe('Todos API', () => {
  beforeAll(async () => {
    try { execSync(`rm -f ./test.db ./prisma/test.db ./prisma/${dbFile}`); } catch {}
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    token = await signupAndLogin('todos@example.com');
    otherToken = await signupAndLogin('other-todos@example.com');
  }, 60000);

  afterAll(() => {
    try { execSync(`rm -f ./test.db ./prisma/test.db ./prisma/${dbFile}`); } catch {}
  });

  it('requires auth for todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
  });

  it('creates and lists todos for the authenticated user only', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Write API', description: 'Build todo routes' })
      .expect(201);

    expect(created.body).toMatchObject({
      title: 'Write API',
      description: 'Build todo routes',
      status: 'pending',
    });
    expect(created.body).toHaveProperty('id');
    expect(created.body).not.toHaveProperty('userId');

    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Other todo', description: 'Hidden from first user', status: 'completed' })
      .expect(201);

    const list = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id: created.body.id, title: 'Write API' });
  });

  it('retrieves a todo and returns 404 for missing or other-user todos', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Read me', description: 'Retrieve this todo', status: 'completed' })
      .expect(201);

    const found = await request(app)
      .get(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(found.body).toMatchObject({ id: created.body.id, title: 'Read me', status: 'completed' });

    await request(app)
      .get('/api/todos/999999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    await request(app)
      .get(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });

  it('returns 400 for invalid ids', async () => {
    await request(app)
      .get('/api/todos/not-a-number')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    await request(app)
      .put('/api/todos/0')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Nope' })
      .expect(400);

    await request(app)
      .delete('/api/todos/-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('returns 422 for invalid create and update payloads', async () => {
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Missing description' })
      .expect(422);

    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Invalid status', description: 'No bad statuses', status: 'archived' })
      .expect(422);

    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Validate update', description: 'Payload checks' })
      .expect(201);

    await request(app)
      .put(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(422);

    await request(app)
      .put(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'archived' })
      .expect(422);
  });

  it('updates a todo owned by the authenticated user', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Old title', description: 'Old description' })
      .expect(201);

    const updated = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New title', description: 'New description', status: 'completed' })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: created.body.id,
      title: 'New title',
      description: 'New description',
      status: 'completed',
    });

    await request(app)
      .put(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Steal todo' })
      .expect(404);
  });

  it('deletes a todo and returns 404 on subsequent retrieve', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete me', description: 'Remove this todo' })
      .expect(201);

    await request(app)
      .delete(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(app)
      .delete(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get(`/api/todos/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
