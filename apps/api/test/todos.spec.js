import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(__dirname, '..');
const dbPath = join(apiRoot, 'prisma', 'todos-test.db');

let app;
let firstToken;
let secondToken;

async function signupAndLogin(email, password = 'password123') {
  await request(app).post('/api/auth/signup').send({ email, password }).expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return res.body.token;
}

function authorized(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Todos API', () => {
  beforeAll(async () => {
    if (existsSync(dbPath)) unlinkSync(dbPath);
    execSync('npm run prisma:generate && npm run prisma:push', { cwd: apiRoot, stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    firstToken = await signupAndLogin('todos-owner@example.com');
    secondToken = await signupAndLogin('todos-other@example.com');
  }, 60000);

  afterAll(() => {
    if (existsSync(dbPath)) unlinkSync(dbPath);
  });

  it('requires authentication for todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'Nope' }).expect(401);
  });

  it('adds trimmed todos and lists only the current owner in stable order', async () => {
    const first = await request(app)
      .post('/api/todos')
      .set(authorized(firstToken))
      .send({ title: '  First todo  ' })
      .expect(201);

    const second = await request(app)
      .post('/api/todos')
      .set(authorized(firstToken))
      .send({ title: 'Second todo' })
      .expect(201);

    expect(first.body.title).toBe('First todo');
    expect(first.body.completed).toBe(false);
    expect(first.body.userId).toBeDefined();

    const res = await request(app).get('/api/todos').set(authorized(firstToken)).expect(200);
    expect(res.body.map((todo) => todo.id)).toEqual(expect.arrayContaining([first.body.id, second.body.id]));
    expect(res.body.find((todo) => todo.id === first.body.id).title).toBe('First todo');
    expect(res.body.findIndex((todo) => todo.id === first.body.id)).toBeLessThan(
      res.body.findIndex((todo) => todo.id === second.body.id)
    );
  });

  it('validates blank and missing titles when creating todos', async () => {
    await request(app).post('/api/todos').set(authorized(firstToken)).send({ title: '   ' }).expect(422);
    await request(app).post('/api/todos').set(authorized(firstToken)).send({}).expect(422);
  });

  it('updates titles inline with trimming', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set(authorized(firstToken))
      .send({ title: 'Draft title' })
      .expect(201);

    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set(authorized(firstToken))
      .send({ title: '  Final title  ' })
      .expect(200);

    expect(res.body.title).toBe('Final title');
    expect(res.body.completed).toBe(false);
  });

  it('completes one todo', async () => {
    const created = await request(app)
      .post('/api/todos')
      .set(authorized(firstToken))
      .send({ title: 'Complete me' })
      .expect(201);

    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set(authorized(firstToken))
      .send({ completed: true })
      .expect(200);

    expect(res.body.completed).toBe(true);
  });

  it('completes all outstanding todos owned by the current user', async () => {
    const mine = await request(app)
      .post('/api/todos')
      .set(authorized(firstToken))
      .send({ title: 'Mine incomplete' })
      .expect(201);
    const other = await request(app)
      .post('/api/todos')
      .set(authorized(secondToken))
      .send({ title: 'Other incomplete' })
      .expect(201);

    const res = await request(app).patch('/api/todos/complete-all').set(authorized(firstToken)).expect(200);
    expect(res.body.every((todo) => todo.completed)).toBe(true);

    const otherList = await request(app).get('/api/todos').set(authorized(secondToken)).expect(200);
    expect(otherList.body.find((todo) => todo.id === other.body.id).completed).toBe(false);
    expect(res.body.some((todo) => todo.id === mine.body.id)).toBe(true);
    expect(res.body.some((todo) => todo.id === other.body.id)).toBe(false);
  });

  it('validates ids and update payloads', async () => {
    await request(app).patch('/api/todos/0').set(authorized(firstToken)).send({ completed: true }).expect(400);
    await request(app).patch('/api/todos/not-a-number').set(authorized(firstToken)).send({ completed: true }).expect(400);

    const created = await request(app)
      .post('/api/todos')
      .set(authorized(firstToken))
      .send({ title: 'Validate me' })
      .expect(201);

    await request(app).patch(`/api/todos/${created.body.id}`).set(authorized(firstToken)).send({}).expect(422);
    await request(app).patch(`/api/todos/${created.body.id}`).set(authorized(firstToken)).send({ title: ' ' }).expect(422);
    await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .set(authorized(firstToken))
      .send({ completed: 'yes' })
      .expect(422);
  });

  it('returns 404 for unknown todos and prevents cross-user mutation', async () => {
    await request(app).patch('/api/todos/999999').set(authorized(firstToken)).send({ completed: true }).expect(404);

    const other = await request(app)
      .post('/api/todos')
      .set(authorized(secondToken))
      .send({ title: 'Private todo' })
      .expect(201);

    await request(app)
      .patch(`/api/todos/${other.body.id}`)
      .set(authorized(firstToken))
      .send({ title: 'Stolen title' })
      .expect(404);

    const otherList = await request(app).get('/api/todos').set(authorized(secondToken)).expect(200);
    expect(otherList.body.find((todo) => todo.id === other.body.id).title).toBe('Private todo');
  });
});
