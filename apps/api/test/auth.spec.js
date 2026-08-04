const request = require('supertest');
const { execSync } = require('node:child_process');

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;

describe('Auth API', () => {
  beforeAll(() => {
    execSync('rm -f ./prisma/test.db ./prisma/test.db-journal && npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    app = require('../src/server');
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./prisma/test.db ./prisma/test.db-journal'); } catch {}
  });

  it('signup succeeds with valid email/password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'a@example.com', password: 'password123', name: 'A' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('signup with duplicate email returns 422', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password123' })
      .expect(201);
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dup@example.com', password: 'password123' })
      .expect(422);
  });

  it('login with wrong credentials returns 400', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'b@example.com', password: 'password123' })
      .expect(201);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'b@example.com', password: 'wrong' })
      .expect(400);
  });

  it('login with correct credentials returns 200 and a token', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'c@example.com', password: 'password123' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'c@example.com', password: 'password123' })
      .expect(200);
    expect(res.body).toHaveProperty('token');
  });
});
