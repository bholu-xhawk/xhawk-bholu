import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./transactions-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let otherToken;

async function signupAndLogin(email) {
  await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'password123' })
    .expect(201);

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
    .expect(200);

  return res.body.token;
}

function auth(tokenValue = token) {
  return { Authorization: `Bearer ${tokenValue}` };
}

describe('Transactions API', () => {
  beforeAll(async () => {
    execSync('rm -f ./transactions-test.db ./prisma/transactions-test.db && npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    token = await signupAndLogin('finance@example.com');
    otherToken = await signupAndLogin('other-finance@example.com');
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./transactions-test.db ./prisma/transactions-test.db'); } catch {}
  });

  it('requires authentication for transaction routes', async () => {
    await request(app).get('/api/transactions').expect(401);
    await request(app)
      .post('/api/transactions')
      .send({
        amount: 100,
        type: 'income',
        category: 'Salary',
        date: '2026-01-01T12:00:00.000Z',
      })
      .expect(401);
  });

  it('lists no transactions initially for a user', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set(auth())
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('creates, serializes, retrieves, updates, and deletes a transaction', async () => {
    const create = await request(app)
      .post('/api/transactions')
      .set(auth())
      .send({
        amount: 42.5,
        type: 'expense',
        category: 'Groceries',
        description: 'Weekly shop',
        date: '2026-02-03T10:15:30.000Z',
      })
      .expect(201);

    expect(create.body).toMatchObject({
      id: expect.any(Number),
      amount: 42.5,
      type: 'expense',
      category: 'Groceries',
      description: 'Weekly shop',
      date: '2026-02-03T10:15:30.000Z',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(create.body).not.toHaveProperty('userId');
    expect(new Date(create.body.createdAt).toISOString()).toBe(create.body.createdAt);
    expect(new Date(create.body.updatedAt).toISOString()).toBe(create.body.updatedAt);

    const id = create.body.id;

    const fetched = await request(app)
      .get(`/api/transactions/${id}`)
      .set(auth())
      .expect(200);

    expect(fetched.body).toEqual(create.body);

    const updated = await request(app)
      .put(`/api/transactions/${id}`)
      .set(auth())
      .send({
        amount: 55.75,
        type: 'income',
        category: 'Refund',
        description: null,
        date: '2026-02-04T10:15:30.000Z',
      })
      .expect(200);

    expect(updated.body).toMatchObject({
      id,
      amount: 55.75,
      type: 'income',
      category: 'Refund',
      description: null,
      date: '2026-02-04T10:15:30.000Z',
    });

    await request(app)
      .delete(`/api/transactions/${id}`)
      .set(auth())
      .expect(204);

    await request(app)
      .get(`/api/transactions/${id}`)
      .set(auth())
      .expect(404);
  });

  it('returns 400 for malformed transaction ids', async () => {
    await request(app)
      .get('/api/transactions/not-a-number')
      .set(auth())
      .expect(400);

    await request(app)
      .put('/api/transactions/0')
      .set(auth())
      .send({ amount: 12 })
      .expect(400);

    await request(app)
      .delete('/api/transactions/-1')
      .set(auth())
      .expect(400);
  });

  it('returns 422 for invalid create and update payloads', async () => {
    await request(app)
      .post('/api/transactions')
      .set(auth())
      .send({
        amount: -1,
        type: 'transfer',
        category: '',
        date: 'not-a-date',
      })
      .expect(422);

    const created = await request(app)
      .post('/api/transactions')
      .set(auth())
      .send({
        amount: 20,
        type: 'expense',
        category: 'Utilities',
        date: '2026-03-01T00:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .put(`/api/transactions/${created.body.id}`)
      .set(auth())
      .send({})
      .expect(422);

    await request(app)
      .put(`/api/transactions/${created.body.id}`)
      .set(auth())
      .send({ amount: 0 })
      .expect(422);
  });

  it('returns 404 for missing transactions', async () => {
    await request(app)
      .get('/api/transactions/999999')
      .set(auth())
      .expect(404);

    await request(app)
      .put('/api/transactions/999999')
      .set(auth())
      .send({ amount: 12 })
      .expect(404);

    await request(app)
      .delete('/api/transactions/999999')
      .set(auth())
      .expect(404);
  });

  it('orders transactions newest first by transaction date', async () => {
    await request(app)
      .post('/api/transactions')
      .set(auth())
      .send({
        amount: 10,
        type: 'expense',
        category: 'Older',
        date: '2026-04-01T00:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .post('/api/transactions')
      .set(auth())
      .send({
        amount: 10,
        type: 'expense',
        category: 'Newest',
        date: '2026-04-03T00:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .post('/api/transactions')
      .set(auth())
      .send({
        amount: 10,
        type: 'expense',
        category: 'Middle',
        date: '2026-04-02T00:00:00.000Z',
      })
      .expect(201);

    const res = await request(app)
      .get('/api/transactions')
      .set(auth())
      .expect(200);

    expect(res.body.map((transaction) => transaction.category).slice(0, 3)).toEqual(['Newest', 'Middle', 'Older']);
  });

  it('isolates transactions between users and returns 404 for other-user records', async () => {
    const ownedByFirstUser = await request(app)
      .post('/api/transactions')
      .set(auth())
      .send({
        amount: 100,
        type: 'income',
        category: 'Private',
        date: '2026-05-01T00:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .get(`/api/transactions/${ownedByFirstUser.body.id}`)
      .set(auth(otherToken))
      .expect(404);

    await request(app)
      .put(`/api/transactions/${ownedByFirstUser.body.id}`)
      .set(auth(otherToken))
      .send({ category: 'Stolen' })
      .expect(404);

    await request(app)
      .delete(`/api/transactions/${ownedByFirstUser.body.id}`)
      .set(auth(otherToken))
      .expect(404);

    const otherList = await request(app)
      .get('/api/transactions')
      .set(auth(otherToken))
      .expect(200);

    expect(otherList.body).toEqual([]);

    await request(app)
      .get(`/api/transactions/${ownedByFirstUser.body.id}`)
      .set(auth())
      .expect(200);
  });
});
