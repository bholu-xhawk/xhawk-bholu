import { createRequire } from 'node:module';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

process.env.JWT_SECRET = 'test-secret';

const require = createRequire(import.meta.url);
const app = require('../src/server');
const financeStore = require('../src/data/financeStore');

function tokenFor(id, email = `user${id}@example.com`) {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

const userOne = tokenFor(1, 'one@example.com');
const userTwo = tokenFor(2, 'two@example.com');
const transactionDate = '2026-11-03T12:00:00.000Z';

async function createAccount(token = userOne, overrides = {}) {
  const res = await request(app)
    .post('/api/accounts')
    .set(auth(token))
    .send({ name: 'Main checking', type: 'checking', balance: 1250.75, ...overrides })
    .expect(201);
  return res.body;
}

async function createCategory(token = userOne, overrides = {}) {
  const res = await request(app)
    .post('/api/categories')
    .set(auth(token))
    .send({ name: 'Paycheck', type: 'income', ...overrides })
    .expect(201);
  return res.body;
}

async function createTransaction(token = userOne, accountId, categoryId, overrides = {}) {
  const res = await request(app)
    .post('/api/transactions')
    .set(auth(token))
    .send({
      accountId,
      categoryId,
      type: 'income',
      amount: 99.5,
      description: 'Initial deposit',
      date: transactionDate,
      ...overrides,
    })
    .expect(201);
  return res.body;
}

describe('Finance API', () => {
  beforeEach(() => {
    financeStore.reset();
  });

  it('requires authentication for finance routes', async () => {
    await request(app).get('/api/accounts').expect(401);
    await request(app).get('/api/categories').expect(401);
    await request(app).get('/api/transactions').expect(401);
  });

  it('supports account CRUD with timestamps, validation, and referenced-delete conflicts', async () => {
    const created = await createAccount();
    expect(created).toMatchObject({ id: 1, userId: 1, name: 'Main checking', type: 'checking', balance: 1250.75 });
    expect(Date.parse(created.createdAt)).not.toBeNaN();
    expect(created.updatedAt).toBe(created.createdAt);

    const list = await request(app).get('/api/accounts').set(auth(userOne)).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(created.id);

    const detail = await request(app).get(`/api/accounts/${created.id}`).set(auth(userOne)).expect(200);
    expect(detail.body.name).toBe('Main checking');

    const updated = await request(app)
      .put(`/api/accounts/${created.id}`)
      .set(auth(userOne))
      .send({ name: 'Emergency fund', type: 'savings', balance: 500 })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, name: 'Emergency fund', type: 'savings', balance: 500 });
    expect(Date.parse(updated.body.updatedAt)).not.toBeNaN();

    const category = await createCategory();
    const transaction = await createTransaction(userOne, created.id, category.id);
    await request(app).delete(`/api/accounts/${created.id}`).set(auth(userOne)).expect(409);
    await request(app).delete(`/api/transactions/${transaction.id}`).set(auth(userOne)).expect(204);
    await request(app).delete(`/api/accounts/${created.id}`).set(auth(userOne)).expect(204);
    await request(app).get(`/api/accounts/${created.id}`).set(auth(userOne)).expect(404);
  });

  it('supports category CRUD and prevents deleting categories referenced by transactions', async () => {
    const created = await createCategory(userOne, { name: 'Groceries', type: 'expense' });
    expect(created).toMatchObject({ id: 1, userId: 1, name: 'Groceries', type: 'expense' });
    expect(Date.parse(created.createdAt)).not.toBeNaN();

    const list = await request(app).get('/api/categories').set(auth(userOne)).expect(200);
    expect(list.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/categories/${created.id}`)
      .set(auth(userOne))
      .send({ name: 'Food' })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, name: 'Food', type: 'expense' });

    const account = await createAccount();
    const transaction = await createTransaction(userOne, account.id, created.id, { type: 'expense' });
    await request(app).delete(`/api/categories/${created.id}`).set(auth(userOne)).expect(409);
    await request(app).delete(`/api/transactions/${transaction.id}`).set(auth(userOne)).expect(204);
    await request(app).delete(`/api/categories/${created.id}`).set(auth(userOne)).expect(204);
  });

  it('supports transaction CRUD with same-user references and category/type consistency', async () => {
    const account = await createAccount();
    const income = await createCategory();
    const expense = await createCategory(userOne, { name: 'Rent', type: 'expense' });

    const created = await createTransaction(userOne, account.id, income.id);
    expect(created).toMatchObject({
      id: 1,
      userId: 1,
      accountId: account.id,
      categoryId: income.id,
      type: 'income',
      amount: 99.5,
      description: 'Initial deposit',
      date: transactionDate,
    });
    expect(created.updatedAt).toBe(created.createdAt);

    const list = await request(app).get('/api/transactions').set(auth(userOne)).expect(200);
    expect(list.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/transactions/${created.id}`)
      .set(auth(userOne))
      .send({ categoryId: expense.id, type: 'expense', amount: 50, description: 'Rent' })
      .expect(200);
    expect(updated.body).toMatchObject({ id: created.id, categoryId: expense.id, type: 'expense', amount: 50 });

    await request(app).get(`/api/transactions/${created.id}`).set(auth(userOne)).expect(200);
    await request(app).delete(`/api/transactions/${created.id}`).set(auth(userOne)).expect(204);
    await request(app).get(`/api/transactions/${created.id}`).set(auth(userOne)).expect(404);
  });

  it('rejects malformed IDs, empty updates, invalid payloads, money values, references, and type mismatches', async () => {
    await request(app).get('/api/accounts/not-a-number').set(auth(userOne)).expect(400);
    await request(app).post('/api/accounts').set(auth(userOne)).send({ name: '', type: 'checking', balance: 1 }).expect(422);
    await request(app).post('/api/accounts').set(auth(userOne)).send({ name: 'Bad', type: 'checking', balance: null }).expect(422);
    await request(app).post('/api/categories').set(auth(userOne)).send({ name: 'Bad', type: 'transfer' }).expect(422);

    const account = await createAccount();
    const income = await createCategory();
    const expense = await createCategory(userOne, { name: 'Dining', type: 'expense' });

    await request(app).put(`/api/accounts/${account.id}`).set(auth(userOne)).send({}).expect(422);
    await request(app).put(`/api/categories/${income.id}`).set(auth(userOne)).send({}).expect(422);
    await request(app).post('/api/transactions').set(auth(userOne)).send({
      accountId: account.id,
      categoryId: income.id,
      type: 'income',
      amount: 0,
      date: transactionDate,
    }).expect(422);
    await request(app).post('/api/transactions').set(auth(userOne)).send({
      accountId: account.id,
      categoryId: income.id,
      type: 'income',
      amount: 10,
      date: 'not-a-date',
    }).expect(422);
    await request(app).post('/api/transactions').set(auth(userOne)).send({
      accountId: 999,
      categoryId: income.id,
      type: 'income',
      amount: 10,
      date: transactionDate,
    }).expect(404);
    await request(app).post('/api/transactions').set(auth(userOne)).send({
      accountId: account.id,
      categoryId: expense.id,
      type: 'income',
      amount: 10,
      date: transactionDate,
    }).expect(422);

    const transaction = await createTransaction(userOne, account.id, income.id);
    await request(app).put(`/api/transactions/${transaction.id}`).set(auth(userOne)).send({}).expect(422);
    await request(app).put(`/api/transactions/${transaction.id}`).set(auth(userOne)).send({ categoryId: expense.id }).expect(422);
  });

  it('isolates records and references by authenticated user', async () => {
    const userOneAccount = await createAccount(userOne, { name: 'One account' });
    const userOneCategory = await createCategory(userOne, { name: 'One category' });
    const userOneTransaction = await createTransaction(userOne, userOneAccount.id, userOneCategory.id);

    const userTwoAccount = await createAccount(userTwo, { name: 'Two account' });
    const userTwoCategory = await createCategory(userTwo, { name: 'Two category' });

    await request(app).get('/api/accounts').set(auth(userTwo)).expect(200).expect((res) => {
      expect(res.body.map((account) => account.id)).toEqual([userTwoAccount.id]);
    });
    await request(app).get(`/api/accounts/${userOneAccount.id}`).set(auth(userTwo)).expect(404);
    await request(app).put(`/api/accounts/${userOneAccount.id}`).set(auth(userTwo)).send({ name: 'stolen' }).expect(404);
    await request(app).delete(`/api/accounts/${userOneAccount.id}`).set(auth(userTwo)).expect(404);

    await request(app).get(`/api/categories/${userOneCategory.id}`).set(auth(userTwo)).expect(404);
    await request(app).get(`/api/transactions/${userOneTransaction.id}`).set(auth(userTwo)).expect(404);

    await request(app).post('/api/transactions').set(auth(userTwo)).send({
      accountId: userOneAccount.id,
      categoryId: userTwoCategory.id,
      type: 'income',
      amount: 10,
      date: transactionDate,
    }).expect(404);
    await request(app).post('/api/transactions').set(auth(userTwo)).send({
      accountId: userTwoAccount.id,
      categoryId: userOneCategory.id,
      type: 'income',
      amount: 10,
      date: transactionDate,
    }).expect(404);
  });
});
