import request from 'supertest';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Point database to a temp file per test run
process.env.DATABASE_URL = path.join(process.cwd(), 'apps/api/data/test.db');
process.env.JWT_SECRET = 'test-secret';
process.env.CORS_ORIGIN = 'http://localhost:5173';

import { app } from '../src/server.js';
import { ensureSchema, db } from '../src/db.js';

beforeAll(() => {
  // Ensure clean test db
  const dbPath = process.env.DATABASE_URL;
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
  ensureSchema();
});

afterAll(() => {
  const dbPath = process.env.DATABASE_URL;
  try { db.close && db.close(); } catch {}
  if (fs.existsSync(dbPath)) fs.rmSync(dbPath);
});

function getCookieFrom(res) {
  const set = res.headers['set-cookie'];
  if (!set) return null;
  return set.find(c => c.startsWith('token='));
}

describe('auth and users', () => {
  test('signup creates user and sets cookie', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'a@example.com', password: 'secret12', name: 'Alice' });
    expect(res.status).toBe(201);
    const cookie = getCookieFrom(res);
    expect(cookie).toBeTruthy();
  });

  test('login works and invalid login fails', async () => {
    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'secret12' });
    expect(ok.status).toBe(200);
    expect(getCookieFrom(ok)).toBeTruthy();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'wrong' });
    expect(bad.status).toBe(400);
  });

  test('users list requires auth; with cookie returns 200', async () => {
    const unauth = await request(app).get('/api/users');
    expect(unauth.status).toBe(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'secret12' });
    const cookie = getCookieFrom(login);

    const list = await request(app).get('/api/users').set('Cookie', cookie);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.users)).toBe(true);
    expect(list.body.users.length).toBeGreaterThanOrEqual(1);
  });

  test('update user and handle not found', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@example.com', password: 'secret12' });
    const cookie = getCookieFrom(login);

    const users = await request(app).get('/api/users').set('Cookie', cookie);
    const id = users.body.users[0].id;

    const upd = await request(app)
      .put(`/api/users/${id}`)
      .set('Cookie', cookie)
      .send({ name: 'Alice Updated' });
    expect(upd.status).toBe(200);
    expect(upd.body.user.name).toBe('Alice Updated');

    const nf = await request(app)
      .put('/api/users/99999')
      .set('Cookie', cookie)
      .send({ name: 'X' });
    expect(nf.status).toBe(404);
  });

  test('duplicate email rejected', async () => {
    // create second user first
    const login = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'b@example.com', password: 'secret12', name: 'Bob' });
    const cookie = getCookieFrom(login);

    const users = await request(app).get('/api/users').set('Cookie', cookie);
    const alice = users.body.users.find(u => u.email === 'a@example.com');

    const dup = await request(app)
      .put(`/api/users/${alice.id}`)
      .set('Cookie', cookie)
      .send({ email: 'b@example.com' });
    expect(dup.status).toBe(422);
  });
});
