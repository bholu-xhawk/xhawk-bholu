import { createRequire } from 'node:module';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
let app;
let todoStore;

describe('Todos API', () => {
  beforeAll(() => {
    app = require('../src/server.js');
    todoStore = require('../src/todoStore.js');
  });

  beforeEach(() => {
    todoStore.resetTodosForTest();
  });

  it('GET /todos lists initial todos', async () => {
    todoStore.resetTodosForTest([
      { id: 10, title: 'Existing todo', completed: true },
      { id: 11, title: 'Open task', completed: false },
    ]);

    const res = await request(app).get('/todos').expect(200);

    expect(res.body).toEqual([
      { id: 10, title: 'Existing todo', completed: true },
      { id: 11, title: 'Open task', completed: false },
    ]);
  });

  it('POST /todos creates a normalized incomplete todo', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: '  Write   a test  ' })
      .expect(201);

    expect(res.body).toEqual({ id: 1, title: 'Write a test', completed: false });

    const list = await request(app).get('/todos').expect(200);
    expect(list.body).toEqual([res.body]);
  });

  it('POST /todos rejects blank titles', async () => {
    await request(app).post('/todos').send({ title: '   ' }).expect(422);
  });

  it('PUT /todos/:id updates completion and title', async () => {
    const created = await request(app).post('/todos').send({ title: 'Draft task' }).expect(201);

    const res = await request(app)
      .put(`/todos/${created.body.id}`)
      .send({ title: '  Finished   task ', completed: true })
      .expect(200);

    expect(res.body).toEqual({ id: created.body.id, title: 'Finished task', completed: true });
  });

  it('PUT /todos/:id returns 404 for missing todos', async () => {
    await request(app).put('/todos/9999').send({ completed: true }).expect(404);
  });

  it('DELETE /todos/:id removes a todo', async () => {
    const created = await request(app).post('/todos').send({ title: 'Remove me' }).expect(201);

    await request(app).delete(`/todos/${created.body.id}`).expect(204);

    const list = await request(app).get('/todos').expect(200);
    expect(list.body).toEqual([]);
  });

  it('validates bad ids', async () => {
    await request(app).put('/todos/not-a-number').send({ completed: true }).expect(400);
    await request(app).delete('/todos/0').expect(400);
  });
});
