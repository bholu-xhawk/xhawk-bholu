import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;
let userToken;
let otherToken;

async function signupAndLogin(email) {
  await request(app).post('/api/auth/signup').send({ email, password: 'password123' }).expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
  return res.body.token;
}

async function createTodo(token, title) {
  const res = await request(app)
    .post('/api/todos')
    .set('Authorization', `Bearer ${token}`)
    .send({ title })
    .expect(201);
  return res.body;
}

describe('Todos API', () => {
  beforeAll(async () => {
    rmSync('./prisma/todos-test.db', { force: true });
    rmSync('./todos-test.db', { force: true });
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    const prismaMod = await import('../src/prisma.js');
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  beforeEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
    userToken = await signupAndLogin('todo-user@example.com');
    otherToken = await signupAndLogin('other-user@example.com');
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    rmSync('./prisma/todos-test.db', { force: true });
    rmSync('./prisma/todos-test.db-journal', { force: true });
    rmSync('./todos-test.db', { force: true });
    rmSync('./todos-test.db-journal', { force: true });
  });

  it('requires authentication for todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'No token' }).expect(401);
  });

  it('creates trimmed todos and lists only the authenticated user todos', async () => {
    const mine = await createTodo(userToken, '  Write tests  ');
    await createTodo(otherToken, 'Hidden todo');

    expect(mine.title).toBe('Write tests');
    expect(mine.completed).toBe(false);

    const res = await request(app).get('/api/todos').set('Authorization', `Bearer ${userToken}`).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: mine.id, title: 'Write tests', completed: false });
  });

  it('rejects blank todo titles on create and update', async () => {
    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '   ' })
      .expect(422);

    const todo = await createTodo(userToken, 'Keep me');
    await request(app)
      .put(`/api/todos/${todo.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '   ' })
      .expect(422);
  });

  it('updates title and completion for a single owned todo', async () => {
    const todo = await createTodo(userToken, 'Draft title');

    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '  Final title ', completed: true })
      .expect(200);

    expect(res.body).toMatchObject({ id: todo.id, title: 'Final title', completed: true });
  });

  it('returns 404 when updating another user todo', async () => {
    const otherTodo = await createTodo(otherToken, 'Private');

    await request(app)
      .put(`/api/todos/${otherTodo.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ completed: true })
      .expect(404);
  });

  it('complete-all only completes the authenticated user todos', async () => {
    const first = await createTodo(userToken, 'First');
    const second = await createTodo(userToken, 'Second');
    const other = await createTodo(otherToken, 'Other');

    const res = await request(app)
      .put('/api/todos/complete-all')
      .set('Authorization', `Bearer ${userToken}`)
      .send()
      .expect(200);

    expect(res.body).toEqual([
      expect.objectContaining({ id: first.id, completed: true }),
      expect.objectContaining({ id: second.id, completed: true }),
    ]);

    const otherList = await request(app).get('/api/todos').set('Authorization', `Bearer ${otherToken}`).expect(200);
    expect(otherList.body).toEqual([expect.objectContaining({ id: other.id, completed: false })]);
  });
});
