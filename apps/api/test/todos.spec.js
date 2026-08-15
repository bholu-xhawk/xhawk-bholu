import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const testDbPath = join(process.cwd(), 'prisma', 'todos-test.db');
const removeTestDb = () => {
  rmSync(testDbPath, { force: true });
  rmSync(`${testDbPath}-journal`, { force: true });
};

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Todos API', () => {
  beforeAll(async () => {
    removeTestDb();
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  afterAll(() => {
    removeTestDb();
  });

  it('lists todos ordered by id and fetches a todo by id', async () => {
    const first = await request(app).post('/api/todos').send({ title: 'First todo' }).expect(201);
    const second = await request(app)
      .post('/api/todos')
      .send({ title: 'Second todo', description: 'More detail', completed: true })
      .expect(201);

    const list = await request(app).get('/api/todos').expect(200);
    expect(list.body.map((todo) => todo.id)).toEqual([first.body.id, second.body.id]);
    expect(list.body[0]).toEqual(expect.objectContaining({ title: 'First todo', completed: false }));
    expect(list.body[1]).toEqual(expect.objectContaining({ title: 'Second todo', description: 'More detail', completed: true }));

    const fetched = await request(app).get(`/api/todos/${second.body.id}`).expect(200);
    expect(fetched.body).toEqual(expect.objectContaining({ id: second.body.id, title: 'Second todo' }));
  });

  it('creates, edits, and deletes a todo', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Draft todo', description: 'Before edit' })
      .expect(201);

    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'Draft todo',
        description: 'Before edit',
        completed: false,
      })
    );

    const updated = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({ title: 'Edited todo', description: null, completed: true })
      .expect(200);
    expect(updated.body).toEqual(expect.objectContaining({ title: 'Edited todo', description: null, completed: true }));

    await request(app).delete(`/api/todos/${created.body.id}`).expect(204);
    await request(app).get(`/api/todos/${created.body.id}`).expect(404);
  });

  it('returns 400 for invalid ids', async () => {
    await request(app).get('/api/todos/not-a-number').expect(400);
    await request(app).put('/api/todos/0').send({ title: 'Nope' }).expect(400);
    await request(app).delete('/api/todos/-1').expect(400);
  });

  it('returns 422 for invalid payloads', async () => {
    await request(app).post('/api/todos').send({ title: '' }).expect(422);
    await request(app).post('/api/todos').send({ title: 'Valid', completed: 'yes' }).expect(422);
    const created = await request(app).post('/api/todos').send({ title: 'Payload target' }).expect(201);
    await request(app).put(`/api/todos/${created.body.id}`).send({ title: '' }).expect(422);
  });

  it('returns 404 for missing todos', async () => {
    await request(app).get('/api/todos/999999').expect(404);
    await request(app).put('/api/todos/999999').send({ title: 'Missing' }).expect(404);
    await request(app).delete('/api/todos/999999').expect(404);
  });
});
