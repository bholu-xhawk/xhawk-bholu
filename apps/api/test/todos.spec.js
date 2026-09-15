import request from 'supertest';
import { execSync } from 'node:child_process';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

let app;
let resetTodos;

function expectTodoShape(todo) {
  expect(todo).toEqual({
    id: expect.any(Number),
    title: expect.any(String),
    description: expect.any(String),
    completed: expect.any(Boolean),
  });
}

describe('Todos API', () => {
  beforeAll(async () => {
    execSync('npm run prisma:generate', { stdio: 'inherit', env: process.env });
    const serverMod = await import('../src/server.js');
    const storeMod = await import('../src/todoStore.js');
    app = serverMod.default || serverMod;
    resetTodos = storeMod.resetTodos;
  }, 60000);

  beforeEach(() => {
    resetTodos();
  });

  it('GET /todos returns seeded todos with the expected shape', async () => {
    const res = await request(app).get('/todos').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach(expectTodoShape);
  });

  it('POST /todos creates a todo with defaults', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Write tests' })
      .expect(201);

    expect(res.body).toEqual({
      id: expect.any(Number),
      title: 'Write tests',
      description: '',
      completed: false,
    });

    const list = await request(app).get('/todos').expect(200);
    expect(list.body).toContainEqual(res.body);
  });

  it('GET /todos/:id reads a created todo', async () => {
    const created = await request(app)
      .post('/todos')
      .send({ title: 'Read me', description: 'Created during the test', completed: true })
      .expect(201);

    const res = await request(app).get(`/todos/${created.body.id}`).expect(200);

    expect(res.body).toEqual(created.body);
  });

  it('PUT /todos/:id updates a todo', async () => {
    const created = await request(app)
      .post('/todos')
      .send({ title: 'Original title', description: 'Original description' })
      .expect(201);

    const res = await request(app)
      .put(`/todos/${created.body.id}`)
      .send({ title: 'Updated title', completed: true })
      .expect(200);

    expect(res.body).toEqual({
      id: created.body.id,
      title: 'Updated title',
      description: 'Original description',
      completed: true,
    });
  });

  it('DELETE /todos/:id returns 204 and makes the todo unreadable', async () => {
    const created = await request(app)
      .post('/todos')
      .send({ title: 'Delete me' })
      .expect(201);

    await request(app).delete(`/todos/${created.body.id}`).expect(204);
    await request(app).get(`/todos/${created.body.id}`).expect(404, { error: 'Todo not found' });
  });

  it('returns JSON errors for invalid ids', async () => {
    const res = await request(app).get('/todos/not-a-number').expect(400);

    expect(res.body).toEqual({ error: 'Invalid id' });
  });

  it('returns JSON errors for invalid payloads', async () => {
    const createRes = await request(app).post('/todos').send({ title: '' }).expect(422);
    expect(createRes.body).toMatchObject({ error: 'Invalid input' });
    expect(createRes.body.details).toBeDefined();

    const updateRes = await request(app).put('/todos/1').send({ completed: 'yes' }).expect(422);
    expect(updateRes.body).toMatchObject({ error: 'Invalid input' });
    expect(updateRes.body.details).toBeDefined();
  });
});
