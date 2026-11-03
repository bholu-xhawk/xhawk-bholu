import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

function removeDatabase() {
  rmSync('./prisma/todos-test.db', { force: true });
  rmSync('./prisma/todos-test.db-journal', { force: true });
}

let app;
let firstToken;
let secondToken;

async function signupAndLogin(email) {
  await request(app).post('/api/auth/signup').send({ email, password: 'password123' }).expect(201);
  const login = await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
  return login.body.token;
}

function authed(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Todos API', () => {
  beforeAll(async () => {
    removeDatabase();
    execSync('npx prisma generate && npx prisma db push', { stdio: 'inherit', cwd: process.cwd(), env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    firstToken = await signupAndLogin('todos-one@example.com');
    secondToken = await signupAndLogin('todos-two@example.com');
  }, 60000);

  afterAll(() => {
    removeDatabase();
  });

  it('requires authentication for todo operations', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'No token' }).expect(401);
  });

  it('creates and lists only todos owned by the authenticated user', async () => {
    const firstTodo = await request(app)
      .post('/api/todos')
      .set(authed(firstToken))
      .send({ title: '  First private todo  ' })
      .expect(201);
    expect(firstTodo.body).toEqual(expect.objectContaining({ title: 'First private todo', completed: false }));

    await request(app).post('/api/todos').set(authed(secondToken)).send({ title: 'Second private todo' }).expect(201);

    const firstList = await request(app).get('/api/todos').set(authed(firstToken)).expect(200);
    expect(firstList.body.map((todo) => todo.title)).toContain('First private todo');
    expect(firstList.body.map((todo) => todo.title)).not.toContain('Second private todo');

    const secondList = await request(app).get('/api/todos').set(authed(secondToken)).expect(200);
    expect(secondList.body.map((todo) => todo.title)).toEqual(['Second private todo']);
  });

  it('edits a title and completes a single owned todo', async () => {
    const created = await request(app).post('/api/todos').set(authed(firstToken)).send({ title: 'Draft title' }).expect(201);

    const edited = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .set(authed(firstToken))
      .send({ title: '  Saved title  ' })
      .expect(200);
    expect(edited.body).toEqual(expect.objectContaining({ title: 'Saved title', completed: false }));

    const completed = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .set(authed(firstToken))
      .send({ completed: true })
      .expect(200);
    expect(completed.body).toEqual(expect.objectContaining({ title: 'Saved title', completed: true }));
  });

  it('marks all pending todos complete for only the current owner', async () => {
    const pendingOne = await request(app).post('/api/todos').set(authed(firstToken)).send({ title: 'Pending one' }).expect(201);
    const pendingTwo = await request(app).post('/api/todos').set(authed(firstToken)).send({ title: 'Pending two' }).expect(201);
    const otherOwner = await request(app).post('/api/todos').set(authed(secondToken)).send({ title: 'Other pending' }).expect(201);

    const result = await request(app).put('/api/todos/complete-all').set(authed(firstToken)).expect(200);
    expect(result.body.count).toBeGreaterThanOrEqual(2);

    const firstList = await request(app).get('/api/todos').set(authed(firstToken)).expect(200);
    const changed = firstList.body.filter((todo) => [pendingOne.body.id, pendingTwo.body.id].includes(todo.id));
    expect(changed).toHaveLength(2);
    expect(changed.every((todo) => todo.completed)).toBe(true);

    const secondList = await request(app).get('/api/todos').set(authed(secondToken)).expect(200);
    expect(secondList.body.find((todo) => todo.id === otherOwner.body.id)).toEqual(expect.objectContaining({ completed: false }));
  });

  it('validates input and hides inaccessible todo ids', async () => {
    await request(app).post('/api/todos').set(authed(firstToken)).send({ title: '   ' }).expect(422);
    await request(app).put('/api/todos/not-a-number').set(authed(firstToken)).send({ completed: true }).expect(400);

    const other = await request(app).post('/api/todos').set(authed(secondToken)).send({ title: 'Not yours' }).expect(201);
    await request(app).put(`/api/todos/${other.body.id}`).set(authed(firstToken)).send({ completed: true }).expect(404);
    await request(app).put(`/api/todos/${other.body.id}`).set(authed(secondToken)).send({ title: '' }).expect(422);
    await request(app).put(`/api/todos/${other.body.id}`).set(authed(secondToken)).send({}).expect(422);
  });
});
