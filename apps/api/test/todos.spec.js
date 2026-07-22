import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const dbPath = path.join(process.cwd(), 'prisma', `todos.${process.pid}.test.db`);
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.JWT_SECRET = 'test-secret';

function removeTestDb() {
  rmSync(dbPath, { force: true });
  rmSync(`${dbPath}-journal`, { force: true });
}

let app;
let prisma;

describe('Todos API', () => {
  beforeAll(async () => {
    removeTestDb();
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
    await prisma?.$disconnect();
    removeTestDb();
  });

  it('GET /api/todos returns an empty list', async () => {
    const res = await request(app).get('/api/todos').expect(200);

    expect(res.body).toEqual([]);
  });

  it('POST /api/todos validates title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '   ' }).expect(422);

    expect(res.body).toHaveProperty('error', 'Invalid input');
  });

  it('POST /api/todos creates a todo with a trimmed title', async () => {
    const res = await request(app).post('/api/todos').send({ title: '  Buy milk  ' }).expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'Buy milk',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    );
  });

  it('DELETE /api/todos/:id deletes a todo and returns 404 when repeated', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Delete me' }).expect(201);

    await request(app).delete(`/api/todos/${created.body.id}`).expect(204);
    await request(app).delete(`/api/todos/${created.body.id}`).expect(404);
  });

  it('DELETE /api/todos/:id validates id', async () => {
    await request(app).delete('/api/todos/not-a-number').expect(400);
  });

  it('DELETE /api/todos removes selected todos and leaves unselected todos', async () => {
    const first = await request(app).post('/api/todos').send({ title: 'First' }).expect(201);
    const second = await request(app).post('/api/todos').send({ title: 'Second' }).expect(201);
    const third = await request(app).post('/api/todos').send({ title: 'Third' }).expect(201);

    const deleted = await request(app)
      .delete('/api/todos')
      .send({ ids: [first.body.id, third.body.id, 99999] })
      .expect(200);

    expect(deleted.body).toEqual({ deletedCount: 2 });

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toEqual(expect.objectContaining({ id: second.body.id, title: 'Second' }));
  });

  it('DELETE /api/todos validates ids', async () => {
    await request(app).delete('/api/todos').send({ ids: [] }).expect(422);
    await request(app).delete('/api/todos').send({ ids: [1, -2] }).expect(422);
  });
});
