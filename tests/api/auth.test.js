const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../../src/index');
const { db, migrate } = require('../../src/db');

describe('Auth API', () => {
  beforeAll(() => {
    migrate();
  });

  afterAll(() => {
    try { db.close(); } catch (_) {}
  });

  test('POST /api/auth/signup returns 201 and token for valid payload', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'secret12', name: 'Test' })
      .expect(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: 'test@example.com', name: 'Test' });
  });

  test('POST /api/auth/signup returns 422 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'another12', name: 'Dup' })
      .expect(422);
    expect(res.body.error).toMatch(/already in use/i);
  });

  test('POST /api/auth/login returns 200 and token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'secret12' })
      .expect(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ email: 'test@example.com' });
  });

  test('POST /api/auth/login returns 400 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' })
      .expect(400);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test('GET /api/users without Authorization returns 401', async () => {
    await request(app).get('/api/users').expect(401);
  });

  test('GET /api/users with token returns 200 and array', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'secret12' })
      .expect(200);
    const token = login.body.token;
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});
