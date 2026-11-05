import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

process.env.DATABASE_URL = 'file:./customers-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;

const dbPath = path.resolve('prisma/customers-test.db');

function removeDb() {
  for (const file of [dbPath, `${dbPath}-journal`]) {
    if (existsSync(file)) rmSync(file, { force: true });
  }
}

function customer(index, overrides = {}) {
  return {
    name: `Customer ${String(index).padStart(2, '0')}`,
    email: `customer${String(index).padStart(2, '0')}@example.com`,
    company: `Company ${index % 5}`,
    status: ['active', 'inactive', 'pending'][index % 3],
    signedUpAt: new Date(Date.UTC(2024, 0, index)),
    ...overrides,
  };
}

describe('Customers API', () => {
  beforeAll(async () => {
    removeDb();
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const serverMod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = serverMod.default || serverMod;
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  beforeEach(async () => {
    vi.restoreAllMocks();
    await prisma.customer.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    removeDb();
  });

  it('returns the first 20 customers with pagination metadata', async () => {
    await prisma.customer.createMany({ data: Array.from({ length: 25 }, (_, index) => customer(index + 1)) });

    const res = await request(app).get('/api/customers').expect(200);

    expect(res.body.customers).toHaveLength(20);
    expect(res.body.customers[0]).toMatchObject({ name: 'Customer 01', email: 'customer01@example.com' });
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 20, totalItems: 25, totalPages: 2 });
  });

  it('returns later pages using the same filter and fixed page size', async () => {
    await prisma.customer.createMany({ data: Array.from({ length: 25 }, (_, index) => customer(index + 1)) });

    const res = await request(app).get('/api/customers?page=2').expect(200);

    expect(res.body.customers.map((row) => row.name)).toEqual([
      'Customer 21',
      'Customer 22',
      'Customer 23',
      'Customer 24',
      'Customer 25',
    ]);
    expect(res.body.pagination).toEqual({ page: 2, pageSize: 20, totalItems: 25, totalPages: 2 });
  });

  it('searches by trimmed name or email and reports matching totals', async () => {
    await prisma.customer.createMany({
      data: [
        customer(1, { name: 'Alice Neptune', email: 'alice@example.com' }),
        customer(2, { name: 'Bob Mercury', email: 'bob.neptune@example.com' }),
        customer(3, { name: 'Cara Venus', email: 'cara@example.com' }),
      ],
    });

    const res = await request(app).get('/api/customers?search=%20Neptune%20').expect(200);

    expect(res.body.customers.map((row) => row.email)).toEqual(['alice@example.com', 'bob.neptune@example.com']);
    expect(res.body.pagination.totalItems).toBe(2);
  });

  it('sorts each allowed field in both directions', async () => {
    await prisma.customer.createMany({
      data: [
        customer(1, { name: 'Bravo', email: 'bravo@example.com', company: 'Zeta', status: 'pending', signedUpAt: new Date('2024-01-02T00:00:00.000Z') }),
        customer(2, { name: 'Alpha', email: 'alpha@example.com', company: 'Acme', status: 'active', signedUpAt: new Date('2024-01-01T00:00:00.000Z') }),
        customer(3, { name: 'Charlie', email: 'charlie@example.com', company: 'Nimbus', status: 'inactive', signedUpAt: new Date('2024-01-03T00:00:00.000Z') }),
      ],
    });

    const expectations = [
      ['name', 'asc', ['Alpha', 'Bravo', 'Charlie']],
      ['name', 'desc', ['Charlie', 'Bravo', 'Alpha']],
      ['email', 'asc', ['alpha@example.com', 'bravo@example.com', 'charlie@example.com']],
      ['email', 'desc', ['charlie@example.com', 'bravo@example.com', 'alpha@example.com']],
      ['company', 'asc', ['Acme', 'Nimbus', 'Zeta']],
      ['company', 'desc', ['Zeta', 'Nimbus', 'Acme']],
      ['status', 'asc', ['active', 'inactive', 'pending']],
      ['status', 'desc', ['pending', 'inactive', 'active']],
      ['signedUpAt', 'asc', ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z', '2024-01-03T00:00:00.000Z']],
      ['signedUpAt', 'desc', ['2024-01-03T00:00:00.000Z', '2024-01-02T00:00:00.000Z', '2024-01-01T00:00:00.000Z']],
    ];

    for (const [sortBy, sortDirection, expected] of expectations) {
      const res = await request(app).get(`/api/customers?sortBy=${sortBy}&sortDirection=${sortDirection}`).expect(200);
      expect(res.body.customers.map((row) => row[sortBy])).toEqual(expected);
    }
  });

  it('uses id as a deterministic secondary sort for equal values', async () => {
    const first = await prisma.customer.create({ data: customer(1, { name: 'Same Name', email: 'first@example.com' }) });
    const second = await prisma.customer.create({ data: customer(2, { name: 'Same Name', email: 'second@example.com' }) });

    const res = await request(app).get('/api/customers?sortBy=name&sortDirection=asc').expect(200);

    expect(res.body.customers.map((row) => row.id)).toEqual([first.id, second.id]);
  });

  it('rejects invalid query values', async () => {
    await request(app).get('/api/customers?sortBy=passwordHash').expect(400);
    await request(app).get('/api/customers?sortDirection=sideways').expect(400);
    await request(app).get('/api/customers?page=0').expect(400);
  });

  it('returns an empty result with normalized pagination metadata', async () => {
    const res = await request(app).get('/api/customers?search=missing').expect(200);

    expect(res.body.customers).toEqual([]);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  });

  it('passes unexpected database errors to the centralized error handler', async () => {
    const routeMod = await import('../src/routes/customers.js');
    const errorApp = express();
    errorApp.use('/api', routeMod.createCustomersRouter({
      customer: {
        count: vi.fn().mockRejectedValue(new Error('database unavailable')),
        findMany: vi.fn().mockResolvedValue([]),
      },
    }));
    errorApp.use((err, req, res, next) => {
      res.status(500).json({ error: 'Internal server error' });
    });

    const res = await request(errorApp).get('/api/customers').expect(500);

    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
