import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let otherToken;

async function signupAndLogin(email) {
  await request(app).post('/api/auth/signup').send({ email, password: 'password123' }).expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
  return res.body.token;
}

function auth(tokenValue = token) {
  return { Authorization: `Bearer ${tokenValue}` };
}

describe('Todos API', () => {
  beforeAll(async () => {
    for (const path of ['./prisma/todos-test.db', './prisma/todos-test.db-journal']) {
      if (existsSync(path)) unlinkSync(path);
    }
    execSync('npx prisma generate && npx prisma db push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    token = await signupAndLogin('todos@example.com');
    otherToken = await signupAndLogin('other-todos@example.com');
  }, 60000);

  afterAll(() => {
    try {
      for (const path of ['./prisma/todos-test.db', './prisma/todos-test.db-journal']) {
        if (existsSync(path)) unlinkSync(path);
      }
    } catch {}
  });

  it('requires authentication for all todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'No auth' }).expect(401);
    await request(app).patch('/api/todos/1').send({ completed: true }).expect(401);
    await request(app).delete('/api/todos/1').expect(401);
  });

  it('lists an empty owned todo collection', async () => {
    const res = await request(app).get('/api/todos').set(auth()).expect(200);
    expect(res.body).toEqual([]);
  });

  it('creates trimmed todos and returns them in deterministic order', async () => {
    const first = await request(app).post('/api/todos').set(auth()).send({ title: '  Buy milk  ' }).expect(201);
    expect(first.body).toMatchObject({ title: 'Buy milk', completed: false });

    const second = await request(app).post('/api/todos').set(auth()).send({ title: 'Walk dog' }).expect(201);
    const list = await request(app).get('/api/todos').set(auth()).expect(200);

    expect(list.body.map((todo) => todo.id)).toEqual([first.body.id, second.body.id]);
    expect(list.body.map((todo) => todo.title)).toEqual(['Buy milk', 'Walk dog']);
  });

  it('validates create and update payloads and malformed ids', async () => {
    await request(app).post('/api/todos').set(auth()).send({ title: '   ' }).expect(422);
    await request(app).post('/api/todos').set(auth()).send({ title: 'x'.repeat(201) }).expect(422);
    await request(app).patch('/api/todos/not-an-id').set(auth()).send({ completed: true }).expect(400);
    await request(app).patch('/api/todos/1').set(auth()).send({}).expect(422);
    await request(app).patch('/api/todos/1').set(auth()).send({ title: '' }).expect(422);
  });

  it('edits and completes an owned todo', async () => {
    const created = await request(app).post('/api/todos').set(auth()).send({ title: 'Draft task' }).expect(201);

    const edited = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set(auth())
      .send({ title: 'Final task', completed: true })
      .expect(200);

    expect(edited.body).toMatchObject({ id: created.body.id, title: 'Final task', completed: true });
  });

  it('denies cross-user updates and deletes', async () => {
    const mine = await request(app).post('/api/todos').set(auth()).send({ title: 'Private task' }).expect(201);

    await request(app).patch(`/api/todos/${mine.body.id}`).set(auth(otherToken)).send({ completed: true }).expect(404);
    await request(app).delete(`/api/todos/${mine.body.id}`).set(auth(otherToken)).expect(404);

    const list = await request(app).get('/api/todos').set(auth()).expect(200);
    expect(list.body.find((todo) => todo.id === mine.body.id)).toMatchObject({ title: 'Private task', completed: false });
  });

  it('deletes an owned todo', async () => {
    const created = await request(app).post('/api/todos').set(auth()).send({ title: 'Delete me' }).expect(201);

    await request(app).delete(`/api/todos/${created.body.id}`).set(auth()).expect(204);
    await request(app).delete(`/api/todos/${created.body.id}`).set(auth()).expect(404);
  });
});
