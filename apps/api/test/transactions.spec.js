import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

process.env.DATABASE_URL = 'file:./transactions-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let ownerToken;
let otherToken;

const removeTestDatabase = () => {
  for (const path of ['./prisma/transactions-test.db', './prisma/transactions-test.db-journal']) {
    rmSync(path, { force: true });
  }
};

async function signUpAndLogin(email) {
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

describe('Transactions API', () => {
  beforeAll(async () => {
    removeTestDatabase();
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    ownerToken = await signUpAndLogin('owner@example.com');
    otherToken = await signUpAndLogin('other@example.com');
  }, 60000);

  afterAll(() => {
    removeTestDatabase();
  });

  it('requires authentication for the collection', async () => {
    await request(app).get('/api/transactions').expect(401);
    await request(app)
      .post('/api/transactions')
      .send({ type: 'expense', amountCents: 1299, category: 'Food', occurredAt: '2026-11-03T12:00:00.000Z' })
      .expect(401);
  });

  it('creates, lists, reads, updates, and deletes an owned transaction', async () => {
    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        type: 'expense',
        amountCents: 1299,
        category: 'Food',
        description: 'Lunch',
        occurredAt: '2026-11-03T12:00:00.000Z',
      })
      .expect(201);

    expect(created.body).toMatchObject({
      type: 'expense',
      amountCents: 1299,
      category: 'Food',
      description: 'Lunch',
    });
    expect(created.body).toHaveProperty('id');
    expect(created.body).not.toHaveProperty('userId');

    const id = created.body.id;

    const list = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(list.body.map((transaction) => transaction.id)).toContain(id);

    const fetched = await request(app)
      .get(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(fetched.body).toMatchObject({ id, type: 'expense', amountCents: 1299 });

    const updated = await request(app)
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ type: 'income', amountCents: 5000, category: 'Salary', description: null })
      .expect(200);
    expect(updated.body).toMatchObject({
      id,
      type: 'income',
      amountCents: 5000,
      category: 'Salary',
      description: null,
    });

    await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(app)
      .get(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('rejects malformed ids, invalid create bodies, and empty updates', async () => {
    await request(app)
      .get('/api/transactions/not-an-id')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ type: 'expense', amountCents: 0, category: 'Food', occurredAt: '2026-11-03T12:00:00.000Z' })
      .expect(422);

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ type: 'transfer', amountCents: 1200, category: 'Food', occurredAt: '2026-11-03T12:00:00.000Z' })
      .expect(422);

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ type: 'expense', amountCents: 1200, category: 'Food', occurredAt: 'not-a-date' })
      .expect(422);

    await request(app)
      .put('/api/transactions/9999')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({})
      .expect(422);
  });

  it('returns 404 for nonexistent transactions', async () => {
    await request(app)
      .get('/api/transactions/999999')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);

    await request(app)
      .put('/api/transactions/999999')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ category: 'Missing' })
      .expect(404);

    await request(app)
      .delete('/api/transactions/999999')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('hides one user transaction from another user', async () => {
    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ type: 'expense', amountCents: 4200, category: 'Travel', occurredAt: '2026-11-02T09:00:00.000Z' })
      .expect(201);
    const id = created.body.id;

    await request(app)
      .get(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(app)
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ category: 'Stolen' })
      .expect(404);

    await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    const ownerRead = await request(app)
      .get(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(ownerRead.body).toMatchObject({ id, category: 'Travel' });

    const otherList = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(otherList.body.map((transaction) => transaction.id)).not.toContain(id);
  });
});
