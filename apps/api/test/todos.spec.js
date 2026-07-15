import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

const databaseFile = `todos-${process.pid}.test.db`;

process.env.DATABASE_URL = `file:./${databaseFile}`;
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;

describe('Todos API', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const serverMod = await import('../src/server.js');
    app = serverMod.default || serverMod;
    const prismaMod = await import('../src/prisma.js');
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  beforeEach(async () => {
    await prisma.todo.deleteMany();
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    try { execSync(`rm -f ./${databaseFile} ./${databaseFile}-journal ./prisma/${databaseFile} ./prisma/${databaseFile}-journal`); } catch {}
  });

  it('POST /api/todos creates a todo with default fields', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Write API docs' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      title: 'Write API docs',
      description: '',
      status: 'pending',
    });
    expect(new Date(res.body.createdAt).toString()).not.toBe('Invalid Date');
    expect(new Date(res.body.updatedAt).toString()).not.toBe('Invalid Date');
  });

  it('GET /api/todos lists todos by id and GET /api/todos/:id reads one', async () => {
    const first = await request(app)
      .post('/api/todos')
      .send({ title: 'First todo', description: 'Created first' })
      .expect(201);
    const second = await request(app)
      .post('/api/todos')
      .send({ title: 'Second todo' })
      .expect(201);

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.map((todo) => todo.id)).toEqual([first.body.id, second.body.id]);

    const read = await request(app).get(`/api/todos/${first.body.id}`).expect(200);
    expect(read.body).toMatchObject({
      id: first.body.id,
      title: 'First todo',
      description: 'Created first',
      status: 'pending',
    });
  });

  it('PUT /api/todos/:id updates a todo status to completed', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Finish tests' })
      .expect(201);

    const updated = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({ status: 'completed' })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: created.body.id,
      title: 'Finish tests',
      description: '',
      status: 'completed',
    });
  });

  it('validates status, title, id, and non-empty updates', async () => {
    await request(app)
      .post('/api/todos')
      .send({ title: 'Bad status', status: 'archived' })
      .expect(422);

    await request(app)
      .post('/api/todos')
      .send({ title: '   ' })
      .expect(422);

    await request(app)
      .get('/api/todos/not-a-number')
      .expect(400);

    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Needs update' })
      .expect(201);

    await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({})
      .expect(422);
  });

  it('returns 404 for missing todos', async () => {
    await request(app).get('/api/todos/9999').expect(404);
    await request(app).put('/api/todos/9999').send({ status: 'completed' }).expect(404);
    await request(app).delete('/api/todos/9999').expect(404);
  });

  it('DELETE /api/todos/:id deletes a todo and subsequent read returns 404', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Delete me' })
      .expect(201);

    await request(app).delete(`/api/todos/${created.body.id}`).expect(204);
    await request(app).get(`/api/todos/${created.body.id}`).expect(404);
  });
});
