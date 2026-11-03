import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanupTestDatabase, resetTestDatabase } from './testDb.js';

process.env.JWT_SECRET = 'test-secret';

let app;
let firstToken;
let secondToken;
const databaseName = 'todos-test.db';

async function signupAndLogin(email) {
  await request(app).post('/api/auth/signup').send({ email, password: 'password123' }).expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
  return res.body.token;
}

function authed(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Todos API', () => {
  beforeAll(async () => {
    resetTestDatabase(databaseName);
    vi.resetModules();
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    firstToken = await signupAndLogin('todos-one@example.com');
    secondToken = await signupAndLogin('todos-two@example.com');
  }, 60000);

  afterAll(() => {
    cleanupTestDatabase(databaseName);
  });

  it('requires authentication for todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'No token' }).expect(401);
  });

  it('creates trimmed todos and lists only the authenticated user todos', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set(authed(firstToken))
      .send({ title: '  Buy milk  ' })
      .expect(201);

    expect(created.body).toMatchObject({ title: 'Buy milk', completed: false });
    expect(created.body).toHaveProperty('id');

    await request(app)
      .post('/api/todos')
      .set(authed(secondToken))
      .send({ title: 'Second user task' })
      .expect(201);

    const list = await request(app).get('/api/todos').set(authed(firstToken)).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id: created.body.id, title: 'Buy milk' });
  });

  it('rejects invalid titles, invalid ids, and empty patches', async () => {
    await request(app).post('/api/todos').set(authed(firstToken)).send({ title: '   ' }).expect(422);
    await request(app).patch('/api/todos/not-a-number').set(authed(firstToken)).send({ completed: true }).expect(400);

    const created = await request(app)
      .post('/api/todos')
      .set(authed(firstToken))
      .send({ title: 'Patch target' })
      .expect(201);

    await request(app).patch(`/api/todos/${created.body.id}`).set(authed(firstToken)).send({}).expect(422);
    await request(app).patch(`/api/todos/${created.body.id}`).set(authed(firstToken)).send({ title: ' ' }).expect(422);
  });

  it('updates a single todo title and completion state', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set(authed(firstToken))
      .send({ title: 'Original title' })
      .expect(201);

    const renamed = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set(authed(firstToken))
      .send({ title: '  Renamed title  ' })
      .expect(200);
    expect(renamed.body).toMatchObject({ id: created.body.id, title: 'Renamed title', completed: false });

    const completed = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set(authed(firstToken))
      .send({ completed: true })
      .expect(200);
    expect(completed.body).toMatchObject({ id: created.body.id, title: 'Renamed title', completed: true });
  });

  it('returns 404 for missing or non-owned todos', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set(authed(firstToken))
      .send({ title: 'Private todo' })
      .expect(201);

    await request(app).patch('/api/todos/99999').set(authed(firstToken)).send({ completed: true }).expect(404);
    await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set(authed(secondToken))
      .send({ completed: true })
      .expect(404);
  });

  it('completes only the authenticated user incomplete todos in bulk', async () => {
    const firstOpen = await request(app)
      .post('/api/todos')
      .set(authed(firstToken))
      .send({ title: 'First open' })
      .expect(201);
    const firstDone = await request(app)
      .post('/api/todos')
      .set(authed(firstToken))
      .send({ title: 'First done' })
      .expect(201);
    const secondOpen = await request(app)
      .post('/api/todos')
      .set(authed(secondToken))
      .send({ title: 'Second open' })
      .expect(201);

    await request(app)
      .patch(`/api/todos/${firstDone.body.id}`)
      .set(authed(firstToken))
      .send({ completed: true })
      .expect(200);

    const completed = await request(app).patch('/api/todos/complete-all').set(authed(firstToken)).expect(200);

    const completedById = new Map(completed.body.map((todo) => [todo.id, todo]));
    expect(completedById.get(firstOpen.body.id).completed).toBe(true);
    expect(completedById.get(firstDone.body.id).completed).toBe(true);

    const secondList = await request(app).get('/api/todos').set(authed(secondToken)).expect(200);
    const secondTodo = secondList.body.find((todo) => todo.id === secondOpen.body.id);
    expect(secondTodo).toMatchObject({ title: 'Second open', completed: false });
  });
});
