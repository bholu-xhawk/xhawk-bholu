import request from 'supertest';
import { app } from '../src/server.js';

function randEmail() {
  return `user_${Math.random().toString(36).slice(2)}@test.local`;
}

describe('Auth endpoints', () => {
  test('signup returns 201 with token and user', async () => {
    const email = randEmail();
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email, password: 'pass1234' })
      .expect(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toBeTruthy();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('duplicate signup returns 422', async () => {
    const email = randEmail();
    await request(app).post('/api/auth/signup').send({ email, password: 'a' }).expect(201);
    const res = await request(app).post('/api/auth/signup').send({ email, password: 'a' }).expect(422);
    expect(res.body.error).toMatch(/exists/i);
  });

  test('login with wrong password returns 422', async () => {
    const email = randEmail();
    await request(app).post('/api/auth/signup').send({ email, password: 'right' }).expect(201);
    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong' }).expect(422);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test('login with correct credentials returns 200 with token', async () => {
    const email = randEmail();
    await request(app).post('/api/auth/signup').send({ email, password: 'right' }).expect(201);
    const res = await request(app).post('/api/auth/login').send({ email, password: 'right' }).expect(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });
});
