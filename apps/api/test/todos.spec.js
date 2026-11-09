import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Todos API', () => {
  beforeAll(async () => {
    rmSync('prisma/todos-test.db', { force: true });
    rmSync('prisma/todos-test.db-journal', { force: true });
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  afterAll(() => {
    rmSync('prisma/todos-test.db', { force: true });
    rmSync('prisma/todos-test.db-journal', { force: true });
  });

  it('GET /api/todos starts with an empty unauthenticated list', async () => {
    const res = await request(app).get('/api/todos').expect(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/todos creates a trimmed todo and later GET persists it', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: '  Buy milk  ' })
      .expect(201);

    expect(created.body).toMatchObject({ id: expect.any(Number), title: 'Buy milk', completed: false });
    expect(created.body).toHaveProperty('createdAt');
    expect(created.body).toHaveProperty('updatedAt');

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id: created.body.id, title: 'Buy milk', completed: false });
  });

  it('GET /api/todos returns records in deterministic id order', async () => {
    const second = await request(app).post('/api/todos').send({ title: 'Second todo' }).expect(201);
    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.map((todo) => todo.id)).toEqual([...list.body.map((todo) => todo.id)].sort((a, b) => a - b));
    expect(list.body.at(-1)).toMatchObject({ id: second.body.id, title: 'Second todo' });
  });

  it('PUT /api/todos/:id edits titles and toggles completion', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Draft title' }).expect(201);

    const renamed = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({ title: '  Final title  ' })
      .expect(200);
    expect(renamed.body).toMatchObject({ id: created.body.id, title: 'Final title', completed: false });

    const completed = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({ completed: true })
      .expect(200);
    expect(completed.body).toMatchObject({ id: created.body.id, title: 'Final title', completed: true });
  });

  it('DELETE /api/todos/:id removes a todo and future updates return 404', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Delete me' }).expect(201);

    await request(app).delete(`/api/todos/${created.body.id}`).expect(204);
    await request(app).put(`/api/todos/${created.body.id}`).send({ completed: true }).expect(404);
  });

  it('validates invalid ids and invalid payloads', async () => {
    await request(app).put('/api/todos/not-a-number').send({ completed: true }).expect(400);
    await request(app).delete('/api/todos/0').expect(400);
    await request(app).post('/api/todos').send({ title: '   ' }).expect(422);
    await request(app).post('/api/todos').send({ title: 'Valid', extra: true }).expect(422);
    await request(app).put('/api/todos/1').send({}).expect(422);
    await request(app).put('/api/todos/1').send({ completed: 'yes' }).expect(422);
    await request(app).put('/api/todos/1').send({ title: 'Valid', extra: true }).expect(422);
  });

  it('returns 404 for missing ids', async () => {
    await request(app).put('/api/todos/999999').send({ title: 'Missing' }).expect(404);
    await request(app).delete('/api/todos/999999').expect(404);
  });
});
