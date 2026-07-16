import request from 'supertest';
import { app } from '../src/server.js';
import { updateUser } from '../src/store/users.js';

function randEmail(prefix = 'user') {
  return `${prefix}_${Math.random().toString(36).slice(2)}@test.local`;
}

async function signup(email = randEmail(), password = 'password') {
  const res = await request(app).post('/api/auth/signup').send({ email, password }).expect(201);
  return res.body;
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Users endpoints RBAC', () => {
  test('non-admin cannot list users', async () => {
    const { token } = await signup(randEmail('u1'), 'p1');
    await request(app).get('/api/users').set(authHeader(token)).expect(403);
  });

  test('admin can list users', async () => {
    const { token: adminToken, user: admin } = await signup(randEmail('admin'), 'p2');
    await updateUser(admin.id, { isAdmin: true });
    const res = await request(app).get('/api/users').set(authHeader(adminToken)).expect(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  test('self read/update/delete flow', async () => {
    const { token, user } = await signup(randEmail('self'), 'p3');
    const uid = user.id;

    const getRes = await request(app).get(`/api/users/${uid}`).set(authHeader(token)).expect(200);
    expect(getRes.body.user.id).toBe(uid);

    const nextEmail = randEmail('self2');
    const patchRes = await request(app)
      .patch(`/api/users/${uid}`)
      .set(authHeader(token))
      .send({ email: nextEmail })
      .expect(200);
    expect(patchRes.body.user.email).toBe(nextEmail);

    await request(app).delete(`/api/users/${uid}`).set(authHeader(token)).expect(204);

    await request(app).get(`/api/users/${uid}`).set(authHeader(token)).expect(401);
  });
});
