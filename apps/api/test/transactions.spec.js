import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
process.env.DATABASE_URL = 'file:./transactions-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let tokenA;
let tokenB;
let userA;
let userB;
let prisma;

function cleanupDatabase() {
  rmSync('./transactions-test.db', { force: true });
  rmSync('./transactions-test.db-journal', { force: true });
  rmSync('./prisma/transactions-test.db', { force: true });
  rmSync('./prisma/transactions-test.db-journal', { force: true });
}

async function signupAndLogin(email) {
  const signup = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'password123', name: email.split('@')[0] })
    .expect(201);
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
    .expect(200);
  return { user: signup.body, token: login.body.token };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Transactions API', () => {
  beforeAll(async () => {
    cleanupDatabase();
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const prismaMod = await import('../src/prisma.js');
    prisma = prismaMod.default || prismaMod;
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    ({ user: userA, token: tokenA } = await signupAndLogin('transactions-a@example.com'));
    ({ user: userB, token: tokenB } = await signupAndLogin('transactions-b@example.com'));
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    cleanupDatabase();
  });

  it('requires authentication for transaction routes', async () => {
    await request(app).get('/api/transactions').expect(401);
    await request(app).post('/api/transactions').send({}).expect(401);
  });

  it('creates, lists, reads, updates, and deletes transactions for the signed-in user', async () => {
    const older = await request(app)
      .post('/api/transactions')
      .set(auth(tokenA))
      .send({
        amountCents: 1250,
        type: 'expense',
        category: 'Groceries',
        description: 'Apples',
        occurredAt: '2026-01-10T09:30:00.000Z',
      })
      .expect(201);

    expect(older.body).toMatchObject({
      userId: userA.id,
      amountCents: 1250,
      type: 'expense',
      category: 'Groceries',
      description: 'Apples',
      occurredAt: '2026-01-10T09:30:00.000Z',
    });
    expect(older.body).toHaveProperty('id');
    expect(older.body).toHaveProperty('createdAt');
    expect(older.body).toHaveProperty('updatedAt');

    const newer = await request(app)
      .post('/api/transactions')
      .set(auth(tokenA))
      .send({
        amountCents: 500000,
        type: 'income',
        category: 'Salary',
        occurredAt: '2026-02-01T00:00:00.000Z',
      })
      .expect(201);

    const list = await request(app)
      .get('/api/transactions')
      .set(auth(tokenA))
      .expect(200);
    expect(list.body.map((transaction) => transaction.id)).toEqual([newer.body.id, older.body.id]);

    const read = await request(app)
      .get(`/api/transactions/${older.body.id}`)
      .set(auth(tokenA))
      .expect(200);
    expect(read.body).toMatchObject(older.body);

    const updated = await request(app)
      .put(`/api/transactions/${older.body.id}`)
      .set(auth(tokenA))
      .send({ amountCents: 1500, description: null, occurredAt: '2026-01-11T10:00:00.000Z' })
      .expect(200);
    expect(updated.body).toMatchObject({
      id: older.body.id,
      userId: userA.id,
      amountCents: 1500,
      type: 'expense',
      category: 'Groceries',
      description: null,
      occurredAt: '2026-01-11T10:00:00.000Z',
    });

    await request(app)
      .delete(`/api/transactions/${older.body.id}`)
      .set(auth(tokenA))
      .expect(204);
    await request(app)
      .get(`/api/transactions/${older.body.id}`)
      .set(auth(tokenA))
      .expect(404);
  });

  it('validates malformed ids and invalid payloads', async () => {
    await request(app)
      .get('/api/transactions/not-a-number')
      .set(auth(tokenA))
      .expect(400);

    await request(app)
      .post('/api/transactions')
      .set(auth(tokenA))
      .send({
        amountCents: 12.34,
        type: 'transfer',
        category: '',
        occurredAt: '2026-01-10',
      })
      .expect(422);

    const created = await request(app)
      .post('/api/transactions')
      .set(auth(tokenA))
      .send({
        amountCents: 999,
        type: 'expense',
        category: 'Utilities',
        occurredAt: '2026-03-15T12:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .put(`/api/transactions/${created.body.id}`)
      .set(auth(tokenA))
      .send({})
      .expect(422);

    await request(app)
      .put(`/api/transactions/${created.body.id}`)
      .set(auth(tokenA))
      .send({ amountCents: -1 })
      .expect(422);
  });

  it('returns 404 for missing transactions', async () => {
    await request(app)
      .get('/api/transactions/999999')
      .set(auth(tokenA))
      .expect(404);
    await request(app)
      .put('/api/transactions/999999')
      .set(auth(tokenA))
      .send({ category: 'Missing' })
      .expect(404);
    await request(app)
      .delete('/api/transactions/999999')
      .set(auth(tokenA))
      .expect(404);
  });

  it('isolates transactions between users without leaking foreign records', async () => {
    const ownedByA = await request(app)
      .post('/api/transactions')
      .set(auth(tokenA))
      .send({
        amountCents: 4200,
        type: 'expense',
        category: 'Travel',
        occurredAt: '2026-04-01T08:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .post('/api/transactions')
      .set(auth(tokenB))
      .send({
        amountCents: 7700,
        type: 'income',
        category: 'Bonus',
        occurredAt: '2026-04-02T08:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .get(`/api/transactions/${ownedByA.body.id}`)
      .set(auth(tokenB))
      .expect(404);
    await request(app)
      .put(`/api/transactions/${ownedByA.body.id}`)
      .set(auth(tokenB))
      .send({ category: 'Changed by B' })
      .expect(404);
    await request(app)
      .delete(`/api/transactions/${ownedByA.body.id}`)
      .set(auth(tokenB))
      .expect(404);

    const stillOwnedByA = await request(app)
      .get(`/api/transactions/${ownedByA.body.id}`)
      .set(auth(tokenA))
      .expect(200);
    expect(stillOwnedByA.body.category).toBe('Travel');

    const listB = await request(app)
      .get('/api/transactions')
      .set(auth(tokenB))
      .expect(200);
    expect(listB.body).toHaveLength(1);
    expect(listB.body[0]).toMatchObject({ userId: userB.id, category: 'Bonus' });
  });

  it('cascades transaction cleanup when a user is deleted', async () => {
    const { user, token } = await signupAndLogin('transactions-cascade@example.com');
    const transaction = await request(app)
      .post('/api/transactions')
      .set(auth(token))
      .send({
        amountCents: 3333,
        type: 'income',
        category: 'Gift',
        occurredAt: '2026-05-01T08:00:00.000Z',
      })
      .expect(201);

    await request(app)
      .delete(`/api/users/${user.id}`)
      .set(auth(tokenA))
      .expect(204);

    const persisted = await prisma.transaction.findUnique({ where: { id: transaction.body.id } });
    expect(persisted).toBeNull();
  });
});
