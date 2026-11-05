import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./customers-test.db';
process.env.JWT_SECRET = 'test-secret';

const dbPath = path.resolve(process.cwd(), 'prisma/customers-test.db');

let app;
let prisma;
let token;

function removeTestDb() {
  for (const file of [dbPath, `${dbPath}-journal`, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
}

function makeCustomer(index, overrides = {}) {
  return {
    name: `Customer ${String(index).padStart(2, '0')}`,
    email: `customer${String(index).padStart(2, '0')}@example.com`,
    company: `Company ${index % 4}`,
    status: index % 2 === 0 ? 'active' : 'paused',
    signedUpAt: new Date(Date.UTC(2024, 0, index + 1)),
    ...overrides,
  };
}

async function seedCustomers(count, overrides = () => ({})) {
  const created = [];
  for (let index = 1; index <= count; index += 1) {
    created.push(await prisma.customer.create({ data: makeCustomer(index, overrides(index)) }));
  }
  return created;
}

function listCustomers(query = {}) {
  return request(app).get('/api/customers').set('Authorization', `Bearer ${token}`).query(query);
}

describe('Customers API', () => {
  beforeAll(async () => {
    removeTestDb();
    execSync('npm run prisma:generate && npm run prisma:push', { cwd: process.cwd(), stdio: 'inherit', env: process.env });
    const serverMod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = serverMod.default || serverMod;
    prisma = prismaMod.default || prismaMod;

    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'customers-admin@example.com', password: 'password123', name: 'Admin' })
      .expect(201);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customers-admin@example.com', password: 'password123' })
      .expect(200);
    token = login.body.token;
  }, 60000);

  beforeEach(async () => {
    await prisma.customer.deleteMany();
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    removeTestDb();
  });

  it('requires authentication', async () => {
    await request(app).get('/api/customers').expect(401);
  });

  it('returns default signed-up descending first page and metadata', async () => {
    await seedCustomers(25);

    const res = await listCustomers().expect(200);

    expect(res.body).toMatchObject({ page: 1, pageSize: 20, total: 25, totalPages: 2 });
    expect(res.body.items).toHaveLength(20);
    expect(res.body.items[0].name).toBe('Customer 25');
    expect(res.body.items[19].name).toBe('Customer 06');
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Customer 25',
        email: 'customer25@example.com',
        company: 'Company 1',
        status: 'paused',
        signedUpAt: expect.any(String),
      })
    );
  });

  it('returns later and out-of-range pages without clamping requested page', async () => {
    await seedCustomers(21);

    const pageTwo = await listCustomers({ page: 2 }).expect(200);
    expect(pageTwo.body).toMatchObject({ page: 2, pageSize: 20, total: 21, totalPages: 2 });
    expect(pageTwo.body.items).toHaveLength(1);

    const beyond = await listCustomers({ page: 4 }).expect(200);
    expect(beyond.body).toMatchObject({ page: 4, pageSize: 20, total: 21, totalPages: 2, items: [] });
  });

  it('searches name and email case-insensitively and reports filtered totals', async () => {
    await prisma.customer.createMany({
      data: [
        makeCustomer(1, { name: 'Acme Buyer', email: 'buyer@example.com' }),
        makeCustomer(2, { name: 'Other Person', email: 'vip@Example.COM' }),
        makeCustomer(3, { name: 'No Match', email: 'none@example.com' }),
      ],
    });

    const byName = await listCustomers({ search: ' acME ' }).expect(200);
    expect(byName.body).toMatchObject({ total: 1, totalPages: 1 });
    expect(byName.body.items.map((item) => item.name)).toEqual(['Acme Buyer']);

    const byEmail = await listCustomers({ search: 'VIP@example' }).expect(200);
    expect(byEmail.body).toMatchObject({ total: 1, totalPages: 1 });
    expect(byEmail.body.items.map((item) => item.email)).toEqual(['vip@Example.COM']);
  });

  it.each(['name', 'email', 'company', 'status', 'signedUpAt'])('sorts by %s in both directions with stable id ties', async (sort) => {
    const tieValue = sort === 'signedUpAt' ? new Date(Date.UTC(2024, 6, 1)) : 'same-value';
    const low = makeCustomer(1, { name: 'Bravo', email: 'bravo@example.com', company: 'Beta', status: 'trial', signedUpAt: new Date(Date.UTC(2024, 0, 1)) });
    const high = makeCustomer(2, { name: 'Charlie', email: 'charlie@example.com', company: 'Gamma', status: 'won', signedUpAt: new Date(Date.UTC(2024, 0, 2)) });
    const tiedOne = makeCustomer(3, { name: 'Alpha', email: 'alpha1@example.com', company: 'Acme', status: 'active', signedUpAt: new Date(Date.UTC(2024, 0, 3)), [sort]: tieValue });
    const tiedTwo = makeCustomer(4, { name: 'Delta', email: 'delta@example.com', company: 'Delta Co', status: 'paused', signedUpAt: new Date(Date.UTC(2024, 0, 4)), [sort]: tieValue });
    const created = [];
    for (const data of [low, high, tiedOne, tiedTwo]) created.push(await prisma.customer.create({ data }));

    const asc = await listCustomers({ sort, direction: 'asc' }).expect(200);
    const desc = await listCustomers({ sort, direction: 'desc' }).expect(200);

    const ascValues = asc.body.items.map((item) => item[sort]);
    const descValues = desc.body.items.map((item) => item[sort]);
    expect(ascValues).toEqual([...ascValues].sort());
    expect(descValues).toEqual([...descValues].sort().reverse());

    const ascTieIds = asc.body.items.filter((item) => item[sort] === (sort === 'signedUpAt' ? tieValue.toISOString() : tieValue)).map((item) => item.id);
    const descTieIds = desc.body.items.filter((item) => item[sort] === (sort === 'signedUpAt' ? tieValue.toISOString() : tieValue)).map((item) => item.id);
    expect(ascTieIds).toEqual([created[2].id, created[3].id]);
    expect(descTieIds).toEqual([created[3].id, created[2].id]);
  });

  it.each([
    [{ page: '0' }, 'Invalid page'],
    [{ page: '-1' }, 'Invalid page'],
    [{ page: '1.5' }, 'Invalid page'],
    [{ sort: 'passwordHash' }, 'Invalid sort'],
    [{ direction: 'sideways' }, 'Invalid direction'],
  ])('rejects malformed query %j', async (query, message) => {
    const res = await listCustomers(query).expect(400);
    expect(res.body).toEqual({ error: message });
  });
});
