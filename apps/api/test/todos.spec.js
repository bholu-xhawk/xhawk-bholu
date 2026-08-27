import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./test-todos.db';
process.env.JWT_SECRET = 'test-secret';
process.env.CORS_ORIGIN = 'http://localhost:5173';

let app;
let prisma;
let userCounter = 0;

describe('Todos API', () => {
  beforeAll(async () => {
    execSync('npm run prisma:generate && npm run prisma:push', {
      stdio: 'inherit',
      env: process.env,
    });
    const appMod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = appMod.default || appMod;
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  beforeEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    try {
      unlinkSync('./prisma/test-todos.db');
    } catch {}
  });

  async function authHeader() {
    userCounter += 1;
    const email = `todo-user-${userCounter}@example.com`;
    await request(app)
      .post('/api/auth/signup')
      .send({ email, password: 'password123' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);

    return `Bearer ${res.body.token}`;
  }

  it('requires authentication for todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'Nope' }).expect(401);
    await request(app)
      .patch('/api/todos/1')
      .send({ completed: true })
      .expect(401);
    await request(app).delete('/api/todos/1').expect(401);
  });

  it('creates and lists todos in insertion order for the authenticated user', async () => {
    const token = await authHeader();

    const first = await request(app)
      .post('/api/todos')
      .set('Authorization', token)
      .send({ title: '  Buy milk  ' })
      .expect(201);

    expect(first.body).toMatchObject({
      id: expect.any(Number),
      title: 'Buy milk',
      completed: false,
    });
    expect(first.body).not.toHaveProperty('userId');
    expect(first.body.createdAt).toEqual(expect.any(String));
    expect(first.body.updatedAt).toEqual(expect.any(String));

    const second = await request(app)
      .post('/api/todos')
      .set('Authorization', token)
      .send({ title: 'Write tests' })
      .expect(201);

    const list = await request(app)
      .get('/api/todos')
      .set('Authorization', token)
      .expect(200);
    expect(list.body.map((todo) => todo.id)).toEqual([
      first.body.id,
      second.body.id,
    ]);
    expect(list.body.map((todo) => todo.title)).toEqual([
      'Buy milk',
      'Write tests',
    ]);
  });

  it('isolates todos between authenticated users', async () => {
    const firstToken = await authHeader();
    const secondToken = await authHeader();

    const firstTodo = await request(app)
      .post('/api/todos')
      .set('Authorization', firstToken)
      .send({ title: 'First user task' })
      .expect(201);

    await request(app)
      .post('/api/todos')
      .set('Authorization', secondToken)
      .send({ title: 'Second user task' })
      .expect(201);

    const firstList = await request(app)
      .get('/api/todos')
      .set('Authorization', firstToken)
      .expect(200);
    expect(firstList.body.map((todo) => todo.title)).toEqual([
      'First user task',
    ]);

    const secondList = await request(app)
      .get('/api/todos')
      .set('Authorization', secondToken)
      .expect(200);
    expect(secondList.body.map((todo) => todo.title)).toEqual([
      'Second user task',
    ]);

    await request(app)
      .patch(`/api/todos/${firstTodo.body.id}`)
      .set('Authorization', secondToken)
      .send({ completed: true })
      .expect(404);
    await request(app)
      .delete(`/api/todos/${firstTodo.body.id}`)
      .set('Authorization', secondToken)
      .expect(404);

    const unchanged = await request(app)
      .get('/api/todos')
      .set('Authorization', firstToken)
      .expect(200);
    expect(unchanged.body[0]).toMatchObject({
      id: firstTodo.body.id,
      completed: false,
    });
  });

  it('toggles a todo completed state', async () => {
    const token = await authHeader();
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', token)
      .send({ title: 'Toggle me' })
      .expect(201);

    const updated = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set('Authorization', token)
      .send({ completed: true })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: created.body.id,
      title: 'Toggle me',
      completed: true,
    });
  });

  it('deletes a todo', async () => {
    const token = await authHeader();
    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', token)
      .send({ title: 'Delete me' })
      .expect(201);

    await request(app)
      .delete(`/api/todos/${created.body.id}`)
      .set('Authorization', token)
      .expect(204);

    const list = await request(app)
      .get('/api/todos')
      .set('Authorization', token)
      .expect(200);
    expect(list.body).toEqual([]);
  });

  it('validates ids and request bodies', async () => {
    const token = await authHeader();

    await request(app)
      .post('/api/todos')
      .set('Authorization', token)
      .send({ title: '' })
      .expect(422);
    await request(app)
      .post('/api/todos')
      .set('Authorization', token)
      .send({ title: 'ok', completed: false })
      .expect(422);
    await request(app)
      .patch('/api/todos/nope')
      .set('Authorization', token)
      .send({ completed: true })
      .expect(400);
    await request(app)
      .delete('/api/todos/0')
      .set('Authorization', token)
      .expect(400);

    const created = await request(app)
      .post('/api/todos')
      .set('Authorization', token)
      .send({ title: 'Validate patch' })
      .expect(201);

    await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set('Authorization', token)
      .send({ completed: 'yes' })
      .expect(422);
  });

  it('returns 404 for missing todos', async () => {
    const token = await authHeader();

    await request(app)
      .patch('/api/todos/99999')
      .set('Authorization', token)
      .send({ completed: true })
      .expect(404);
    await request(app)
      .delete('/api/todos/99999')
      .set('Authorization', token)
      .expect(404);
  });

  it('responds to browser CORS preflight requests from the Vite dev server', async () => {
    const res = await request(app)
      .options('/api/todos')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')
      .expect(204);

    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173'
    );
    expect(res.headers['access-control-allow-methods']).toContain('POST');
    expect(res.headers['access-control-allow-headers']).toContain(
      'Content-Type'
    );
  });
});
