import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

const appMod = await import('../src/server.js');
const app = appMod.default || appMod;
const todosMod = await import('../src/routes/todos.js');
const { resetTodosForTest } = todosMod.default || todosMod;

describe('Todos API', () => {
  beforeEach(() => {
    resetTodosForTest();
  });

  it('creates, lists, reads, updates, and deletes todos', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Buy milk' })
      .expect(201);

    expect(created.body).toMatchObject({
      id: 1,
      title: 'Buy milk',
      completed: false,
    });
    expect(created.body.createdAt).toEqual(expect.any(String));
    expect(created.body.updatedAt).toEqual(expect.any(String));

    const second = await request(app)
      .post('/api/todos')
      .send({ title: 'Walk dog', completed: true })
      .expect(201);
    expect(second.body).toMatchObject({ id: 2, title: 'Walk dog', completed: true });

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body).toHaveLength(2);
    expect(list.body.map((todo) => todo.id)).toEqual([1, 2]);

    const detail = await request(app).get('/api/todos/1').expect(200);
    expect(detail.body).toMatchObject({ id: 1, title: 'Buy milk', completed: false });

    const updated = await request(app)
      .patch('/api/todos/1')
      .send({ completed: true })
      .expect(200);
    expect(updated.body).toMatchObject({ id: 1, title: 'Buy milk', completed: true });

    await request(app).delete('/api/todos/1').expect(204);
    await request(app).get('/api/todos/1').expect(404, { error: 'Todo not found' });

    const remaining = await request(app).get('/api/todos').expect(200);
    expect(remaining.body).toMatchObject([{ id: 2, title: 'Walk dog', completed: true }]);
  });

  it('validates create payloads', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: '' })
      .expect(422);

    expect(res.body).toHaveProperty('error', 'Invalid input');
    expect(res.body).toHaveProperty('details');
  });

  it('validates update payloads include at least one supported field', async () => {
    await request(app).post('/api/todos').send({ title: 'Buy milk' }).expect(201);

    const res = await request(app)
      .patch('/api/todos/1')
      .send({})
      .expect(422);

    expect(res.body).toHaveProperty('error', 'Invalid input');
    expect(res.body).toHaveProperty('details');
  });

  it('returns 400 for malformed and non-positive ids', async () => {
    await request(app).get('/api/todos/not-a-number').expect(400, { error: 'Invalid id' });
    await request(app).get('/api/todos/0').expect(400, { error: 'Invalid id' });
  });

  it('returns 404 for missing todos', async () => {
    await request(app).get('/api/todos/999').expect(404, { error: 'Todo not found' });
    await request(app).patch('/api/todos/999').send({ completed: true }).expect(404, { error: 'Todo not found' });
    await request(app).delete('/api/todos/999').expect(404, { error: 'Todo not found' });
  });
});
