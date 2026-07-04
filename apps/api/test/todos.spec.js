import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import app from '../src/server';

async function signupAndLogin(email = 'a@example.com', password = 'password123', name = 'A') {
  await request(app).post('/api/auth/signup').send({ email, password, name });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

describe('Todos API', () => {
  let token1;
  let token2;

  beforeAll(async () => {
    token1 = await signupAndLogin('u1@example.com', 'password123', 'U1');
    token2 = await signupAndLogin('u2@example.com', 'password123', 'U2');
  });

  it('GET /api/todos requires auth', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.status).toBe(401);
  });

  it('POST /api/todos creates a todo and validates payload', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'First', description: 'desc' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'First', description: 'desc', done: false });
    expect(res.body).toHaveProperty('id');

    const bad = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: '' });
    expect(bad.status).toBe(422);
  });

  it('GET /api/todos returns only current user\'s todos', async () => {
    // create for user1
    await request(app).post('/api/todos').set('Authorization', `Bearer ${token1}`).send({ title: 'u1 t1' });
    await request(app).post('/api/todos').set('Authorization', `Bearer ${token1}`).send({ title: 'u1 t2' });
    // create for user2
    await request(app).post('/api/todos').set('Authorization', `Bearer ${token2}`).send({ title: 'u2 t1' });

    const res = await request(app).get('/api/todos').set('Authorization', `Bearer ${token1}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    for (const t of res.body) {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('title');
      expect(t).toHaveProperty('done');
    }
  });

  it('PUT /api/todos/:id updates fields and guards ownership', async () => {
    const create = await request(app).post('/api/todos').set('Authorization', `Bearer ${token1}`).send({ title: 'edit me', description: 'old' });
    const id = create.body.id;

    const badId = await request(app).put('/api/todos/abc').set('Authorization', `Bearer ${token1}`).send({ title: 'x' });
    expect(badId.status).toBe(400);

    const notFound = await request(app).put('/api/todos/99999').set('Authorization', `Bearer ${token1}`).send({ title: 'x' });
    expect(notFound.status).toBe(404);

    const payloadInvalid = await request(app).put(`/api/todos/${id}`).set('Authorization', `Bearer ${token1}`).send({ title: '' });
    expect(payloadInvalid.status).toBe(422);

    const ok = await request(app)
      .put(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'new title', description: null });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ id, title: 'new title', description: null });

    // ownership guard: user2 cannot edit user1's todo
    const forbidden = await request(app)
      .put(`/api/todos/${id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'hax' });
    expect(forbidden.status).toBe(404);
  });

  it('POST /api/todos/:id/done marks done and guards ownership', async () => {
    const create = await request(app).post('/api/todos').set('Authorization', `Bearer ${token1}`).send({ title: 'done it' });
    const id = create.body.id;

    const badId = await request(app).post('/api/todos/abc/done').set('Authorization', `Bearer ${token1}`);
    expect(badId.status).toBe(400);

    const notFound = await request(app).post('/api/todos/99999/done').set('Authorization', `Bearer ${token1}`);
    expect(notFound.status).toBe(404);

    const forbidden = await request(app).post(`/api/todos/${id}/done`).set('Authorization', `Bearer ${token2}`);
    expect(forbidden.status).toBe(404);

    const ok = await request(app).post(`/api/todos/${id}/done`).set('Authorization', `Bearer ${token1}`);
    expect(ok.status).toBe(200);
    expect(ok.body.done).toBe(true);
  });
});
