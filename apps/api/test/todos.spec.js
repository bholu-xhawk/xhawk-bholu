import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

const dbPaths = ['./todos-test.db', './prisma/todos-test.db'];

let app;
let userToken;
let otherToken;

async function signupAndLogin(email) {
  await request(app).post('/api/auth/signup').send({ email, password: 'password123' }).expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
  return res.body.token;
}

async function createTodo(token, title) {
  const res = await request(app).post('/api/todos').set('Authorization', `Bearer ${token}`).send({ title }).expect(201);
  return res.body.todo;
}

describe('Todos API', () => {
  beforeAll(async () => {
    for (const dbPath of dbPaths) {
      if (existsSync(dbPath)) rmSync(dbPath, { force: true });
    }
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    userToken = await signupAndLogin('todos-user@example.com');
    otherToken = await signupAndLogin('todos-other@example.com');
  }, 60000);

  afterAll(() => {
    for (const dbPath of dbPaths.map((p) => join(process.cwd(), p))) {
      if (existsSync(dbPath)) rmSync(dbPath, { force: true });
    }
  });

  it('rejects unauthenticated todo requests', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'No auth' }).expect(401);
  });

  it('creates trimmed todos and lists only the authenticated user todos', async () => {
    const todo = await createTodo(userToken, '  Buy milk  ');
    await createTodo(otherToken, 'Other user todo');

    expect(todo).toMatchObject({ title: 'Buy milk', completed: false });

    const res = await request(app).get('/api/todos').set('Authorization', `Bearer ${userToken}`).expect(200);
    expect(res.body.todos).toEqual(expect.arrayContaining([expect.objectContaining({ id: todo.id, title: 'Buy milk' })]));
    expect(res.body.todos).not.toEqual(expect.arrayContaining([expect.objectContaining({ title: 'Other user todo' })]));
  });

  it('rejects blank titles on create and update', async () => {
    await request(app).post('/api/todos').set('Authorization', `Bearer ${userToken}`).send({ title: '   ' }).expect(400);

    const todo = await createTodo(userToken, 'Keep title');
    await request(app).patch(`/api/todos/${todo.id}`).set('Authorization', `Bearer ${userToken}`).send({ title: '   ' }).expect(400);
    await request(app).patch(`/api/todos/${todo.id}`).set('Authorization', `Bearer ${userToken}`).send({}).expect(400);
  });

  it('updates one owned todo title and completion state', async () => {
    const todo = await createTodo(userToken, 'Draft title');

    const titleRes = await request(app)
      .patch(`/api/todos/${todo.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '  Final title  ' })
      .expect(200);
    expect(titleRes.body.todo).toMatchObject({ id: todo.id, title: 'Final title', completed: false });

    const completeRes = await request(app)
      .patch(`/api/todos/${todo.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ completed: true })
      .expect(200);
    expect(completeRes.body.todo).toMatchObject({ id: todo.id, completed: true });
  });

  it('does not allow cross-user updates by guessed id', async () => {
    const otherTodo = await createTodo(otherToken, 'Private item');

    await request(app)
      .patch(`/api/todos/${otherTodo.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ completed: true })
      .expect(404);

    const res = await request(app).get('/api/todos').set('Authorization', `Bearer ${otherToken}`).expect(200);
    expect(res.body.todos).toEqual(expect.arrayContaining([expect.objectContaining({ id: otherTodo.id, completed: false })]));
  });

  it('completes all incomplete todos owned by the caller only', async () => {
    const todoA = await createTodo(userToken, 'Caller A');
    const todoB = await createTodo(userToken, 'Caller B');
    const otherTodo = await createTodo(otherToken, 'Other incomplete');

    const res = await request(app).patch('/api/todos/complete-all').set('Authorization', `Bearer ${userToken}`).expect(200);

    expect(res.body.updatedCount).toBeGreaterThanOrEqual(2);
    expect(res.body.todos).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: todoA.id, completed: true }),
      expect.objectContaining({ id: todoB.id, completed: true }),
    ]));

    const otherRes = await request(app).get('/api/todos').set('Authorization', `Bearer ${otherToken}`).expect(200);
    expect(otherRes.body.todos).toEqual(expect.arrayContaining([expect.objectContaining({ id: otherTodo.id, completed: false })]));
  });
});
