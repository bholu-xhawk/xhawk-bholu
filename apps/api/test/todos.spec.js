import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

const TEST_STORE = './todos.test.json';
process.env.TODO_STORE_PATH = TEST_STORE;

let app;

describe('Todos API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  beforeEach(() => {
    try { fs.unlinkSync(TEST_STORE); } catch {}
  });

  afterAll(() => {
    try { fs.unlinkSync(TEST_STORE); } catch {}
  });

  it('POST /api/todos creates a todo with expected shape', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'First', description: 'desc' })
      .expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'First',
        description: 'desc',
        completed: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    );
  });

  it('GET /api/todos returns created item', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'A' }).expect(201);
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.body.id })]));
  });

  it('GET /api/todos/:id returns 404 for non-existent and 400 for malformed id', async () => {
    await request(app).get('/api/todos/9999').expect(404);
    await request(app).get('/api/todos/abc').expect(400);
  });

  it('PUT /api/todos/:id updates fields and validates', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'B' }).expect(201);
    const id = created.body.id;

    const updated = await request(app)
      .put(`/api/todos/${id}`)
      .send({ title: 'B2', completed: true })
      .expect(200);
    expect(updated.body.title).toBe('B2');
    expect(updated.body.completed).toBe(true);

    await request(app).put(`/api/todos/${id}`).send({ completed: 'not-bool' }).expect(422);

    await request(app).put('/api/todos/9999').send({ title: 'x' }).expect(404);
  });

  it('DELETE /api/todos/:id returns 204 and subsequent GET 404', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'C' }).expect(201);
    const id = created.body.id;
    await request(app).delete(`/api/todos/${id}`).expect(204);
    await request(app).get(`/api/todos/${id}`).expect(404);
  });
});
