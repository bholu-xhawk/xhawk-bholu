import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let app;

async function createTodo(overrides = {}) {
  const payload = {
    title: `Test todo ${Date.now()} ${Math.random()}`,
    description: 'Created by todo API test',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/todos')
    .send(payload)
    .expect(201);

  return res.body;
}

describe('Todos API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  it('POST /api/todos creates a todo with defaults', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Buy milk' })
      .expect(201);

    expect(res.body).toEqual({
      id: expect.any(Number),
      title: 'Buy milk',
      description: '',
      completed: false,
    });
  });

  it('GET /api/todos lists created todos', async () => {
    const todo = await createTodo({ title: 'List me' });

    const res = await request(app)
      .get('/api/todos')
      .expect(200);

    expect(res.body).toEqual(expect.any(Array));
    expect(res.body).toEqual(expect.arrayContaining([todo]));
  });

  it('GET /api/todos/:id returns a created todo', async () => {
    const todo = await createTodo({ title: 'Read me' });

    const res = await request(app)
      .get(`/api/todos/${todo.id}`)
      .expect(200);

    expect(res.body).toEqual(todo);
  });

  it('PUT /api/todos/:id partially updates a todo', async () => {
    const todo = await createTodo({ title: 'Old title', description: 'Old description', completed: false });

    const res = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ title: 'New title', description: 'New description', completed: true })
      .expect(200);

    expect(res.body).toEqual({
      id: todo.id,
      title: 'New title',
      description: 'New description',
      completed: true,
    });

    const partial = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ completed: false })
      .expect(200);

    expect(partial.body).toEqual({
      id: todo.id,
      title: 'New title',
      description: 'New description',
      completed: false,
    });
  });

  it('DELETE /api/todos/:id deletes a todo and subsequent GET returns 404', async () => {
    const todo = await createTodo({ title: 'Delete me' });

    await request(app)
      .delete(`/api/todos/${todo.id}`)
      .expect(204);

    await request(app)
      .get(`/api/todos/${todo.id}`)
      .expect(404);
  });

  it('returns 400 for invalid todo IDs', async () => {
    await request(app).get('/api/todos/not-a-number').expect(400);
    await request(app).put('/api/todos/0').send({ title: 'Nope' }).expect(400);
    await request(app).delete('/api/todos/-1').expect(400);
  });

  it('returns 404 for missing todos', async () => {
    await request(app).get('/api/todos/999999').expect(404);
    await request(app).put('/api/todos/999999').send({ title: 'Missing' }).expect(404);
    await request(app).delete('/api/todos/999999').expect(404);
  });

  it('returns 422 for invalid create payloads', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ description: 'No title' })
      .expect(422);

    expect(res.body).toHaveProperty('error', 'Invalid input');
    expect(res.body).toHaveProperty('details');
  });

  it('returns 422 for invalid and empty update payloads', async () => {
    const todo = await createTodo({ title: 'Validate updates' });

    const empty = await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({})
      .expect(422);

    expect(empty.body).toHaveProperty('error', 'Invalid input');
    expect(empty.body).toHaveProperty('details');

    await request(app)
      .put(`/api/todos/${todo.id}`)
      .send({ completed: 'yes' })
      .expect(422);
  });
});
