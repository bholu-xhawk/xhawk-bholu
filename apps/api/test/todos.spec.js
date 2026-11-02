import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./todos-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;

async function signupAndLogin(email) {
  await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'password123', name: email.split('@')[0] })
    .expect(201);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
    .expect(200);

  return res.body.token;
}

async function createTodo(token, title) {
  const res = await request(app)
    .post('/api/todos')
    .set('Authorization', `Bearer ${token}`)
    .send({ title })
    .expect(201);

  return res.body;
}

describe('Todos API', () => {
  beforeAll(async () => {
    execSync('rm -f ./todos-test.db ./prisma/todos-test.db');
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./todos-test.db ./prisma/todos-test.db'); } catch {}
  });

  it('requires authentication for todo routes', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ title: 'Nope' }).expect(401);
    await request(app).patch('/api/todos/complete-all').expect(401);
    await request(app).patch('/api/todos/1').send({ completed: true }).expect(401);
  });

  it('creates trimmed todos and lists only the authenticated user\'s todos', async () => {
    const tokenA = await signupAndLogin('todos-a@example.com');
    const tokenB = await signupAndLogin('todos-b@example.com');

    const todoA = await createTodo(tokenA, '  Buy milk  ');
    await createTodo(tokenB, 'Private B');

    expect(todoA).toMatchObject({ title: 'Buy milk', completed: false });
    expect(todoA).toHaveProperty('id');
    expect(todoA).not.toHaveProperty('ownerId');

    const listA = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listA.body).toHaveLength(1);
    expect(listA.body[0]).toMatchObject({ id: todoA.id, title: 'Buy milk', completed: false });
  });

  it('validates create and update payloads', async () => {
    const token = await signupAndLogin('todos-validation@example.com');
    const todo = await createTodo(token, 'Valid');

    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '   ' })
      .expect(422);

    await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x'.repeat(201) })
      .expect(422);

    await request(app)
      .patch(`/api/todos/${todo.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(422);

    await request(app)
      .patch(`/api/todos/${todo.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '   ' })
      .expect(422);

    await request(app)
      .patch(`/api/todos/${todo.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: 'yes' })
      .expect(422);
  });

  it('edits a title and completes one item', async () => {
    const token = await signupAndLogin('todos-edit@example.com');
    const first = await createTodo(token, 'First');
    const second = await createTodo(token, 'Second');

    const edited = await request(app)
      .patch(`/api/todos/${first.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '  Updated first  ' })
      .expect(200);

    expect(edited.body).toMatchObject({ id: first.id, title: 'Updated first', completed: false });

    const completed = await request(app)
      .patch(`/api/todos/${first.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true })
      .expect(200);

    expect(completed.body).toMatchObject({ id: first.id, title: 'Updated first', completed: true });

    const list = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.id, completed: true }),
        expect.objectContaining({ id: second.id, completed: false }),
      ])
    );
  });

  it('marks all of the authenticated user\'s incomplete todos complete', async () => {
    const tokenA = await signupAndLogin('todos-bulk-a@example.com');
    const tokenB = await signupAndLogin('todos-bulk-b@example.com');
    await createTodo(tokenA, 'A1');
    await createTodo(tokenA, 'A2');
    const bTodo = await createTodo(tokenB, 'B1');

    const bulk = await request(app)
      .patch('/api/todos/complete-all')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(bulk.body).toHaveLength(2);
    expect(bulk.body.every((todo) => todo.completed)).toBe(true);

    const bList = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    expect(bList.body).toEqual([expect.objectContaining({ id: bTodo.id, completed: false })]);
  });

  it('returns not found for nonexistent or other-user todos', async () => {
    const tokenA = await signupAndLogin('todos-scope-a@example.com');
    const tokenB = await signupAndLogin('todos-scope-b@example.com');
    const privateTodo = await createTodo(tokenA, 'Private A');

    await request(app)
      .patch('/api/todos/999999')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ completed: true })
      .expect(404);

    await request(app)
      .patch(`/api/todos/${privateTodo.id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Stolen' })
      .expect(404);

    const listA = await request(app)
      .get('/api/todos')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listA.body).toEqual([expect.objectContaining({ id: privateTodo.id, title: 'Private A' })]);
  });

  it('validates ids', async () => {
    const token = await signupAndLogin('todos-invalid-id@example.com');

    await request(app)
      .patch('/api/todos/not-a-number')
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true })
      .expect(400);
  });
});
