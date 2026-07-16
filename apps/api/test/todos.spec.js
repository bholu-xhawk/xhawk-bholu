import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;

describe('Todos API', () => {
  beforeAll(async () => {
    try { execSync('rm -f ./prisma/todos-test.db ./prisma/todos-test.db-journal'); } catch {}
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const serverMod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = serverMod.default || serverMod;
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  beforeEach(async () => {
    await prisma.todo.deleteMany();
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    try { execSync('rm -f ./prisma/todos-test.db ./prisma/todos-test.db-journal'); } catch {}
  });

  it('supports unauthenticated create, list, read, update, and delete', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Write tests' })
      .expect(201);

    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'Write tests',
        completed: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    );

    const id = created.body.id;

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toEqual(expect.objectContaining({ id, title: 'Write tests' }));

    const read = await request(app).get(`/api/todos/${id}`).expect(200);
    expect(read.body).toEqual(expect.objectContaining({ id, title: 'Write tests', completed: false }));

    const updated = await request(app)
      .put(`/api/todos/${id}`)
      .send({ title: 'Ship todo app', completed: true })
      .expect(200);
    expect(updated.body).toEqual(expect.objectContaining({ id, title: 'Ship todo app', completed: true }));

    await request(app).delete(`/api/todos/${id}`).expect(204);
    await request(app).get(`/api/todos/${id}`).expect(404);
  });

  it('orders todos by creation time and id', async () => {
    const first = await request(app).post('/api/todos').send({ title: 'First' }).expect(201);
    const second = await request(app).post('/api/todos').send({ title: 'Second', completed: true }).expect(201);

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.map((todo) => todo.id)).toEqual([first.body.id, second.body.id]);
    expect(list.body.map((todo) => todo.completed)).toEqual([false, true]);
  });

  it('validates todo payloads', async () => {
    await request(app).post('/api/todos').send({ title: '' }).expect(422);
    await request(app).post('/api/todos').send({ title: '   ' }).expect(422);

    const created = await request(app).post('/api/todos').send({ title: 'Valid todo' }).expect(201);
    await request(app).put(`/api/todos/${created.body.id}`).send({}).expect(422);
    await request(app).put(`/api/todos/${created.body.id}`).send({ title: '' }).expect(422);
    await request(app).put(`/api/todos/${created.body.id}`).send({ completed: 'yes' }).expect(422);
  });

  it('returns 400 for invalid ids', async () => {
    await request(app).get('/api/todos/not-a-number').expect(400);
    await request(app).put('/api/todos/0').send({ completed: true }).expect(400);
    await request(app).delete('/api/todos/-1').expect(400);
  });

  it('returns 404 for nonexistent ids', async () => {
    await request(app).get('/api/todos/9999').expect(404);
    await request(app).put('/api/todos/9999').send({ completed: true }).expect(404);
    await request(app).delete('/api/todos/9999').expect(404);
  });
});
