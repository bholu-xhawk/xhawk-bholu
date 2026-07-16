import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Todos API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  it('supports unauthenticated CRUD for todos', async () => {
    const initial = await request(app).get('/api/todos').expect(200);
    expect(initial.body).toEqual([]);

    const created = await request(app)
      .post('/api/todos')
      .send({ title: '  Buy milk  ' })
      .expect(201);

    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'Buy milk',
        completed: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    );

    const id = created.body.id;

    await request(app)
      .get(`/api/todos/${id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.title).toBe('Buy milk');
      });

    const updated = await request(app)
      .put(`/api/todos/${id}`)
      .send({ title: 'Buy oat milk', completed: true })
      .expect(200);

    expect(updated.body).toEqual(
      expect.objectContaining({
        id,
        title: 'Buy oat milk',
        completed: true,
      })
    );

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.map((todo) => todo.id)).toContain(id);

    await request(app).delete(`/api/todos/${id}`).expect(204);
    await request(app).get(`/api/todos/${id}`).expect(404);
  });

  it('returns 422 for missing or blank create titles', async () => {
    await request(app).post('/api/todos').send({}).expect(422);
    await request(app).post('/api/todos').send({ title: '   ' }).expect(422);
  });

  it('returns 422 for invalid update payloads', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Update validation' }).expect(201);

    await request(app).put(`/api/todos/${created.body.id}`).send({ title: '   ' }).expect(422);
    await request(app).put(`/api/todos/${created.body.id}`).send({ completed: 'yes' }).expect(422);
  });

  it('returns 400 for invalid ids', async () => {
    await request(app).get('/api/todos/not-a-number').expect(400);
    await request(app).put('/api/todos/0').send({ completed: true }).expect(400);
    await request(app).delete('/api/todos/-1').expect(400);
  });

  it('returns 404 for missing todos', async () => {
    await request(app).get('/api/todos/99999').expect(404);
    await request(app).put('/api/todos/99999').send({ completed: true }).expect(404);
    await request(app).delete('/api/todos/99999').expect(404);
  });
});
