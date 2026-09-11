import request from 'supertest';
import { createRequire } from 'node:module';
import { beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const app = require('../src/server.js');
const todoRoutes = require('../src/routes/todos.js');

function expectTodoShape(todo) {
  expect(todo).toEqual({
    id: expect.any(Number),
    title: expect.any(String),
    completed: expect.any(Boolean),
    description: todo.description,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  });
  expect(typeof todo.description === 'string' || todo.description === null).toBe(true);
  expect(Date.parse(todo.createdAt)).not.toBeNaN();
  expect(Date.parse(todo.updatedAt)).not.toBeNaN();
}

describe('Todos API', () => {
  beforeEach(() => {
    todoRoutes.resetTodos();
  });

  it('POST /api/todos creates a todo with stable fields', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Write mock API', description: 'Document examples' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: 1,
      title: 'Write mock API',
      completed: false,
      description: 'Document examples',
    });
    expectTodoShape(res.body);
    expect(res.body.createdAt).toBe(res.body.updatedAt);
  });

  it('GET /api/todos lists todos sorted by id and GET /api/todos/:id reads one todo', async () => {
    const first = await request(app).post('/api/todos').send({ title: 'First' }).expect(201);
    const second = await request(app)
      .post('/api/todos')
      .send({ title: 'Second', completed: true })
      .expect(201);

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body).toEqual([first.body, second.body]);

    const read = await request(app).get(`/api/todos/${second.body.id}`).expect(200);
    expect(read.body).toEqual(second.body);
  });

  it('PUT /api/todos/:id updates allowed fields and updatedAt', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Draft', description: 'Initial' })
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const updated = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({ title: 'Published', completed: true, description: 'Done' })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: created.body.id,
      title: 'Published',
      completed: true,
      description: 'Done',
      createdAt: created.body.createdAt,
    });
    expect(Date.parse(updated.body.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.body.updatedAt));
    expect(updated.body.updatedAt).not.toBe(created.body.updatedAt);
  });

  it('DELETE /api/todos/:id returns 204 and subsequent read returns 404', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Remove me' }).expect(201);

    await request(app).delete(`/api/todos/${created.body.id}`).expect(204);
    await request(app).get(`/api/todos/${created.body.id}`).expect(404, { error: 'Todo not found' });
  });

  it('returns 400 for invalid ids', async () => {
    await request(app).get('/api/todos/not-a-number').expect(400, { error: 'Invalid id' });
    await request(app).put('/api/todos/0').send({ title: 'Nope' }).expect(400, { error: 'Invalid id' });
    await request(app).delete('/api/todos/-1').expect(400, { error: 'Invalid id' });
  });

  it('returns 404 for missing valid ids', async () => {
    await request(app).get('/api/todos/999').expect(404, { error: 'Todo not found' });
    await request(app).put('/api/todos/999').send({ completed: true }).expect(404, { error: 'Todo not found' });
    await request(app).delete('/api/todos/999').expect(404, { error: 'Todo not found' });
  });

  it('returns 422 for invalid create and update payloads', async () => {
    await request(app).post('/api/todos').send({ title: '' }).expect(422);
    await request(app).post('/api/todos').send({ title: 'Valid', completed: 'yes' }).expect(422);

    const created = await request(app).post('/api/todos').send({ title: 'Valid' }).expect(201);
    await request(app).put(`/api/todos/${created.body.id}`).send({}).expect(422);
    await request(app).put(`/api/todos/${created.body.id}`).send({ title: '' }).expect(422);
  });
});
