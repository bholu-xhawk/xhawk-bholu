import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let otherToken;

async function signupAndLogin(email) {
  await request(app).post('/api/auth/signup').send({ email, password: 'password123' }).expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200);
  return res.body.token;
}

function auth(req, bearer = token) {
  return req.set('Authorization', `Bearer ${bearer}`);
}

async function createTodo(data, bearer = token) {
  const res = await auth(request(app).post('/api/todos'), bearer).send(data).expect(201);
  return res.body;
}

describe('Todos API', () => {
  beforeAll(async () => {
    if (existsSync('./prisma/test.db')) unlinkSync('./prisma/test.db');
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    token = await signupAndLogin('todos@example.com');
    otherToken = await signupAndLogin('other@example.com');
  }, 60000);

  afterAll(() => {
    try {
      if (existsSync('./prisma/test.db')) unlinkSync('./prisma/test.db');
    } catch {}
  });

  it('rejects unauthenticated todo requests', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'Nope' }).expect(401);
  });

  it('creates, reads, updates, and deletes a todo for the authenticated owner', async () => {
    const created = await createTodo({
      title: 'Ship todos',
      description: 'API and UI',
      status: 'todo',
      priority: 'high',
      due_date: '2026-11-01',
    });

    expect(created).toMatchObject({
      title: 'Ship todos',
      description: 'API and UI',
      status: 'todo',
      priority: 'high',
      due_date: '2026-11-01',
    });

    const fetched = await auth(request(app).get(`/api/todos/${created.id}`)).expect(200);
    expect(fetched.body.title).toBe('Ship todos');

    const updated = await auth(request(app).put(`/api/todos/${created.id}`))
      .send({ title: 'Ship todos now', status: 'done', description: null, due_date: null })
      .expect(200);
    expect(updated.body).toMatchObject({ title: 'Ship todos now', status: 'done', description: null, due_date: null });

    await auth(request(app).delete(`/api/todos/${created.id}`)).expect(204);
    await auth(request(app).get(`/api/todos/${created.id}`)).expect(404);
  });

  it('validates create, update, id, list enum, sort, date, and pagination inputs', async () => {
    await auth(request(app).post('/api/todos')).send({ title: '' }).expect(422);
    await auth(request(app).post('/api/todos')).send({ title: 'Bad date', due_date: '2026-02-31' }).expect(422);
    const todo = await createTodo({ title: 'Validate me' });
    await auth(request(app).put(`/api/todos/${todo.id}`)).send({ status: 'blocked' }).expect(422);
    await auth(request(app).put(`/api/todos/${todo.id}`)).send({}).expect(422);
    await auth(request(app).get('/api/todos/nope')).expect(422);
    await auth(request(app).get('/api/todos?status=blocked')).expect(422);
    await auth(request(app).get('/api/todos?priority=urgent')).expect(422);
    await auth(request(app).get('/api/todos?sort_by=title')).expect(422);
    await auth(request(app).get('/api/todos?page=0')).expect(422);
    await auth(request(app).get('/api/todos?page_size=101')).expect(422);
  });

  it('does not reveal or mutate another user\'s todos', async () => {
    const mine = await createTodo({ title: 'Mine' });
    const theirs = await createTodo({ title: 'Theirs' }, otherToken);

    await auth(request(app).get(`/api/todos/${theirs.id}`)).expect(404);
    await auth(request(app).put(`/api/todos/${theirs.id}`)).send({ title: 'Stolen' }).expect(404);
    await auth(request(app).delete(`/api/todos/${theirs.id}`)).expect(404);

    const stillTheirs = await auth(request(app).get(`/api/todos/${theirs.id}`), otherToken).expect(200);
    expect(stillTheirs.body.title).toBe('Theirs');
    const stillMine = await auth(request(app).get(`/api/todos/${mine.id}`)).expect(200);
    expect(stillMine.body.title).toBe('Mine');
  });

  it('filters by status, priority, and title search in the database-backed list', async () => {
    await createTodo({ title: 'Alpha planning', status: 'todo', priority: 'low' });
    await createTodo({ title: 'Alpha build', status: 'in_progress', priority: 'high' });
    await createTodo({ title: 'Beta done', status: 'done', priority: 'high' });

    const filtered = await auth(
      request(app).get('/api/todos?status=in_progress&priority=high&search=Alpha&page_size=10')
    ).expect(200);

    expect(filtered.body.items).toHaveLength(1);
    expect(filtered.body.items[0]).toMatchObject({ title: 'Alpha build', status: 'in_progress', priority: 'high' });
    expect(filtered.body.total).toBe(1);
  });

  it('sorts by due date and created date with pagination metadata and boundaries', async () => {
    const first = await createTodo({ title: 'Due first', due_date: '2026-10-01' });
    const second = await createTodo({ title: 'Due second', due_date: '2026-10-02' });
    const third = await createTodo({ title: 'Due third', due_date: '2026-10-03' });

    const dueAsc = await auth(request(app).get('/api/todos?search=Due&sort_by=due_date&sort_order=asc&page=1&page_size=2')).expect(200);
    expect(dueAsc.body).toMatchObject({ total: 3, page: 1, page_size: 2 });
    expect(dueAsc.body.items.map((todo) => todo.id)).toEqual([first.id, second.id]);

    const pageTwo = await auth(request(app).get('/api/todos?search=Due&sort_by=due_date&sort_order=asc&page=2&page_size=2')).expect(200);
    expect(pageTwo.body.items.map((todo) => todo.id)).toEqual([third.id]);

    const outOfRange = await auth(request(app).get('/api/todos?search=Due&page=99&page_size=2')).expect(200);
    expect(outOfRange.body).toMatchObject({ total: 3, page: 99, page_size: 2, items: [] });

    const createdDesc = await auth(request(app).get('/api/todos?search=Due&sort_by=created_at&sort_order=desc&page_size=3')).expect(200);
    expect(createdDesc.body.items.map((todo) => todo.id)).toEqual([third.id, second.id, first.id]);
  });

  it('keeps a 500-todo collection bounded to one requested page', async () => {
    for (let index = 0; index < 500; index += 1) {
      await createTodo({ title: `Bulk ${String(index).padStart(3, '0')}`, priority: index % 2 ? 'medium' : 'low' });
    }

    const res = await auth(request(app).get('/api/todos?search=Bulk&page=1&page_size=25&sort_by=created_at&sort_order=asc')).expect(200);
    expect(res.body).toMatchObject({ total: 500, page: 1, page_size: 25 });
    expect(res.body.items).toHaveLength(25);
    expect(res.body.items[0].title).toBe('Bulk 000');
    expect(res.body.items[24].title).toBe('Bulk 024');
  }, 60000);
});
