import request from 'supertest';
import jwt from 'jsonwebtoken';
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

process.env.DATABASE_URL = 'file:./customers-test.db';
process.env.JWT_SECRET = 'test-secret';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, '../prisma/customers-test.db');
const journalPath = `${dbPath}-journal`;

let app;
let prisma;
let token;

function removeDb() {
  for (const path of [dbPath, journalPath]) {
    if (existsSync(path)) rmSync(path, { force: true });
  }
}

function dateFor(day) {
  return new Date(`2025-03-${String(day).padStart(2, '0')}T12:00:00.000Z`);
}

function customer(overrides = {}) {
  const { index, ...customerOverrides } = overrides;
  const id = index ?? 1;
  return {
    name: `Customer ${String(id).padStart(2, '0')}`,
    email: `customer${String(id).padStart(2, '0')}@example.com`,
    company: `Company ${String(id % 5).padStart(2, '0')}`,
    status: ['active', 'trial', 'paused', 'churned'][id % 4],
    createdAt: dateFor(id),
    ...customerOverrides,
  };
}

async function seedCustomers() {
  const rows = Array.from({ length: 25 }, (_, index) => customer({ index: index + 1 }));
  rows[4] = customer({
    index: 5,
    name: 'Needle Name',
    email: 'customer05@example.com',
    company: 'Shared Tie Co',
    status: 'active',
    createdAt: dateFor(5),
  });
  rows[9] = customer({
    index: 10,
    name: 'Customer 10',
    email: 'needle-email@example.com',
    company: 'Shared Tie Co',
    status: 'active',
    createdAt: dateFor(10),
  });
  rows[10] = customer({
    index: 11,
    name: 'Customer 11',
    email: 'customer11@example.com',
    company: 'Shared Tie Co',
    status: 'active',
    createdAt: dateFor(10),
  });

  await prisma.customer.createMany({ data: rows });
}

async function allCustomers() {
  return prisma.customer.findMany({
    select: { id: true, name: true, email: true, company: true, status: true, createdAt: true },
  });
}

function sortExpected(customers, field, direction) {
  return [...customers].sort((left, right) => {
    const leftValue = left[field] instanceof Date ? left[field].getTime() : left[field];
    const rightValue = right[field] instanceof Date ? right[field].getTime() : right[field];
    if (leftValue < rightValue) return direction === 'asc' ? -1 : 1;
    if (leftValue > rightValue) return direction === 'asc' ? 1 : -1;
    return left.id - right.id;
  });
}

describe('Customers API', () => {
  beforeAll(async () => {
    removeDb();
    execSync('npm run prisma:generate && npm run prisma:push', {
      cwd: resolve(__dirname, '..'),
      stdio: 'inherit',
      env: process.env,
    });
    const serverMod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = serverMod.default || serverMod;
    prisma = prismaMod.default || prismaMod;
    token = jwt.sign({ id: 1, email: 'admin@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }, 60000);

  beforeEach(async () => {
    await prisma.customer.deleteMany();
    await seedCustomers();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    removeDb();
  });

  it('requires authentication', async () => {
    await request(app).get('/api/customers').expect(401);
  });

  it('returns the first 20 customers and total metadata by default', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.customers).toHaveLength(20);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 20, total: 25, totalPages: 2 });
    expect(res.body.customers[0]).toEqual(
      expect.objectContaining({
        name: 'Customer 25',
        email: 'customer25@example.com',
        company: 'Company 00',
        status: 'trial',
      })
    );
    expect(res.body.customers[0]).toHaveProperty('createdAt');
    expect(res.body.customers[0]).not.toHaveProperty('updatedAt');
  });

  it('returns second-page boundary rows', async () => {
    const res = await request(app)
      .get('/api/customers?page=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.customers).toHaveLength(5);
    expect(res.body.pagination).toEqual({ page: 2, pageSize: 20, total: 25, totalPages: 2 });
    expect(res.body.customers.map((row) => row.email)).toEqual([
      'customer05@example.com',
      'customer04@example.com',
      'customer03@example.com',
      'customer02@example.com',
      'customer01@example.com',
    ]);
  });

  it('searches by customer name or email using matching pagination totals', async () => {
    const res = await request(app)
      .get('/api/customers?search=needle&sortBy=email&sortDirection=asc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.customers.map((row) => row.email)).toEqual([
      'customer05@example.com',
      'needle-email@example.com',
    ]);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 20, total: 2, totalPages: 1 });
  });

  it.each(['name', 'email', 'company', 'status', 'createdAt'])('sorts by %s in both directions with id as a tie breaker', async (field) => {
    const customers = await allCustomers();

    for (const direction of ['asc', 'desc']) {
      const res = await request(app)
        .get(`/api/customers?sortBy=${field}&sortDirection=${direction}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.customers.map((row) => row.id)).toEqual(
        sortExpected(customers, field, direction).slice(0, 20).map((row) => row.id)
      );
    }
  });

  it('returns an empty result for unmatched searches and out-of-range pages', async () => {
    const noMatches = await request(app)
      .get('/api/customers?search=not-a-customer')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(noMatches.body.customers).toEqual([]);
    expect(noMatches.body.pagination).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

    const outOfRange = await request(app)
      .get('/api/customers?page=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(outOfRange.body.customers).toEqual([]);
    expect(outOfRange.body.pagination).toEqual({ page: 3, pageSize: 20, total: 25, totalPages: 2 });
  });

  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'sortBy=passwordHash',
    'sortDirection=sideways',
  ])('rejects invalid query value %s', async (query) => {
    await request(app)
      .get(`/api/customers?${query}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('passes database failures to the centralized error handler', async () => {
    await prisma.$executeRawUnsafe('DROP TABLE "Customer"');

    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .expect(500);

    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
