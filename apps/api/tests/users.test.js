import request from 'supertest';
import { app } from '../src/server.js';

async function signup(email, password, isAdmin = false) {
  const res = await request(app).post('/api/auth/signup').send({ email, password, isAdmin });
  return res.body;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Users endpoints RBAC', () => {
  test('non-admin cannot list users', async () => {
    const { token } = await signup('u1@test.local', 'p1', false);
    await request(app).get('/api/users').set(authHeader(token)).expect(403);
  });

  test('admin can list users', async () => {
    const { token: adminToken } = await signup('admin@test.local', 'p2', true);
    const res = await request(app).get('/api/users').set(authHeader(adminToken)).expect(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  test('self read/update/delete flow', async () => {
    const { token, user } = await signup('self@test.local', 'p3', false);
    const uid = user.id;

    const getRes = await request(app).get(`/api/users/${uid}`).set(authHeader(token)).expect(200);
    expect(getRes.body.user.id).toBe(uid);

    const patchRes = await request(app)
      .patch(`/api/users/${uid}`)
      .set(authHeader(token))
      .send({ email: 'self2@test.local' })
      .expect(200);
    expect(patchRes.body.user.email).toBe('self2@test.local');

    await request(app).delete(`/api/users/${uid}`).set(authHeader(token)).expect(204);

    await request(app).get(`/api/users/${uid}`).set(authHeader(token)).expect(404);
  });
});
