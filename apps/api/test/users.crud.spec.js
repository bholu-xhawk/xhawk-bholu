import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { getAuthHeader } from './helpers/auth.js';

let app;
let authHeader;

describe('Users CRUD API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    authHeader = await getAuthHeader(app);
  }, 60000);

  it('GET /api/users returns [] initially', async () => {
    const res = await request(app)
      .get('/api/users')
      .set(authHeader)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/users creates a user, returns 201 and hides passwordHash', async () => {
    const res = await request(app)
      .post('/api/users')
      .set(authHeader)
      .send({ email: 'u1@example.com', password: 'password123', name: 'U1' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toMatchObject({ email: 'u1@example.com', name: 'U1' });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/users lists created users sorted by id asc', async () => {
    // create a couple users
    await request(app).post('/api/users').set(authHeader).send({ email: 'u2@example.com', password: 'password123', name: 'U2' }).expect(201);
    await request(app).post('/api/users').set(authHeader).send({ email: 'u3@example.com', password: 'password123', name: 'U3' }).expect(201);

    const res = await request(app).get('/api/users').set(authHeader).expect(200);
    const ids = res.body.map(u => u.id);
    const sorted = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sorted);
  });

  it('GET /api/users/:id returns the created user', async () => {
    const created = await request(app)
      .post('/api/users')
      .set(authHeader)
      .send({ email: 'u4@example.com', password: 'password123', name: 'U4' })
      .expect(201);
    const id = created.body.id;

    const res = await request(app)
      .get(`/api/users/${id}`)
      .set(authHeader)
      .expect(200);
    expect(res.body).toMatchObject({ id, email: 'u4@example.com', name: 'U4' });
  });

  it('PUT /api/users/:id updates name and email', async () => {
    const created = await request(app)
      .post('/api/users')
      .set(authHeader)
      .send({ email: 'u5@example.com', password: 'password123', name: 'U5' })
      .expect(201);
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/users/${id}`)
      .set(authHeader)
      .send({ email: 'u5-new@example.com', name: 'U5 new' })
      .expect(200);
    expect(res.body).toMatchObject({ id, email: 'u5-new@example.com', name: 'U5 new' });
  });

  it('PUT /api/users/:id with duplicate email returns 422', async () => {
    const a = await request(app).post('/api/users').set(authHeader).send({ email: 'dup-a@example.com', password: 'password123' }).expect(201);
    const b = await request(app).post('/api/users').set(authHeader).send({ email: 'dup-b@example.com', password: 'password123' }).expect(201);

    await request(app)
      .put(`/api/users/${b.body.id}`)
      .set(authHeader)
      .send({ email: a.body.email })
      .expect(422);
  });

  it('PUT /api/users/:id with invalid id returns 400', async () => {
    await request(app)
      .put('/api/users/abc')
      .set(authHeader)
      .send({ name: 'Nope' })
      .expect(400);
  });

  it('DELETE /api/users/:id returns 204 and removes the user', async () => {
    const created = await request(app)
      .post('/api/users')
      .set(authHeader)
      .send({ email: 'todelete@example.com', password: 'password123' })
      .expect(201);
    const id = created.body.id;

    await request(app).delete(`/api/users/${id}`).set(authHeader).expect(204);
    await request(app).get(`/api/users/${id}`).set(authHeader).expect(404);
  });

  it('GET /api/users/:id for missing user returns 404', async () => {
    await request(app).get('/api/users/999999').set(authHeader).expect(404);
  });

  it('POST /api/users with invalid payload returns 422', async () => {
    await request(app)
      .post('/api/users')
      .set(authHeader)
      .send({ email: 'not-an-email', password: 'short' })
      .expect(422);
  });
});
