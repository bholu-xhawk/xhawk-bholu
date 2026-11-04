import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./customers-test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;
let prisma;

const authHeader = () => ({ Authorization: `Bearer ${token}` });

const customer = (overrides = {}) => ({
  name: 'Customer',
  email: 'customer@example.com',
  company: 'Acme Co',
  status: 'active',
  ...overrides,
});

async function seedCustomers(customers) {
  for (const data of customers) {
    await prisma.customer.create({ data });
  }
}

describe('Customers API', () => {
  beforeAll(async () => {
    execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
    const prismaMod = await import('../src/prisma.js');
    prisma = prismaMod.default || prismaMod;
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    await request(app).post('/api/auth/signup').send({ email: 'admin@example.com', password: 'password123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    token = res.body.token;
  }, 60000);

  beforeEach(async () => {
    await prisma.customer.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    try { execSync('rm -f ./prisma/customers-test.db ./prisma/customers-test.db-journal'); } catch {}
  });

  it('requires bearer authentication', async () => {
    await request(app).get('/api/customers').expect(401);
  });

  it('returns a fixed-size first page and second-page metadata', async () => {
    await seedCustomers(
      Array.from({ length: 25 }, (_, index) =>
        customer({
          name: `Customer ${String(index + 1).padStart(2, '0')}`,
          email: `customer${String(index + 1).padStart(2, '0')}@example.com`,
          company: 'Acme Co',
          status: index % 2 === 0 ? 'active' : 'paused',
        })
      )
    );

    const first = await request(app).get('/api/customers').set(authHeader()).expect(200);
    expect(first.body.data).toHaveLength(20);
    expect(first.body.pagination).toEqual({ page: 1, pageSize: 20, totalItems: 25, totalPages: 2 });
    expect(first.body.data[0].name).toBe('Customer 01');

    const second = await request(app).get('/api/customers?page=2').set(authHeader()).expect(200);
    expect(second.body.data).toHaveLength(5);
    expect(second.body.pagination).toEqual({ page: 2, pageSize: 20, totalItems: 25, totalPages: 2 });
    expect(second.body.data[0].name).toBe('Customer 21');
  });

  it('searches name and email with a trimmed term', async () => {
    await seedCustomers([
      customer({ name: 'Ava Stone', email: 'ava@example.com' }),
      customer({ name: 'Miles North', email: 'miles.vip@example.com' }),
      customer({ name: 'No Match', email: 'nomatch@example.com' }),
    ]);

    const byName = await request(app).get('/api/customers?search=%20Ava%20').set(authHeader()).expect(200);
    expect(byName.body.data.map((row) => row.email)).toEqual(['ava@example.com']);

    const byEmail = await request(app).get('/api/customers?search=vip').set(authHeader()).expect(200);
    expect(byEmail.body.data.map((row) => row.email)).toEqual(['miles.vip@example.com']);
  });

  it('sorts each allowed field in both directions and uses id as a deterministic tie-breaker', async () => {
    await seedCustomers([
      customer({ name: 'Tie', email: 'b@example.com', company: 'Beta', status: 'trial', createdAt: new Date('2024-01-02T00:00:00.000Z') }),
      customer({ name: 'Tie', email: 'a@example.com', company: 'Alpha', status: 'active', createdAt: new Date('2024-01-01T00:00:00.000Z') }),
      customer({ name: 'Zed', email: 'c@example.com', company: 'Gamma', status: 'paused', createdAt: new Date('2024-01-03T00:00:00.000Z') }),
    ]);

    const expectations = {
      name: { asc: ['b@example.com', 'a@example.com', 'c@example.com'], desc: ['c@example.com', 'a@example.com', 'b@example.com'] },
      email: { asc: ['a@example.com', 'b@example.com', 'c@example.com'], desc: ['c@example.com', 'b@example.com', 'a@example.com'] },
      company: { asc: ['a@example.com', 'b@example.com', 'c@example.com'], desc: ['c@example.com', 'b@example.com', 'a@example.com'] },
      status: { asc: ['a@example.com', 'c@example.com', 'b@example.com'], desc: ['b@example.com', 'c@example.com', 'a@example.com'] },
      createdAt: { asc: ['a@example.com', 'b@example.com', 'c@example.com'], desc: ['c@example.com', 'b@example.com', 'a@example.com'] },
    };

    for (const [sortBy, orders] of Object.entries(expectations)) {
      for (const [sortOrder, emails] of Object.entries(orders)) {
        const res = await request(app).get(`/api/customers?sortBy=${sortBy}&sortOrder=${sortOrder}`).set(authHeader()).expect(200);
        expect(res.body.data.map((row) => row.email)).toEqual(emails);
      }
    }
  });

  it('rejects invalid query input with a structured 400 response', async () => {
    const res = await request(app)
      .get('/api/customers?sortBy=passwordHash&sortOrder=sideways&page=0')
      .set(authHeader())
      .expect(400);

    expect(res.body.error).toBe('Invalid query');
    expect(res.body.details.fieldErrors).toMatchObject({ sortBy: expect.any(Array), sortOrder: expect.any(Array), page: expect.any(Array) });
  });

  it('returns an empty result and clamps pages beyond the last page', async () => {
    const empty = await request(app).get('/api/customers?search=missing').set(authHeader()).expect(200);
    expect(empty.body).toEqual({ data: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } });

    await seedCustomers([customer({ name: 'Only Customer', email: 'only@example.com' })]);
    const clamped = await request(app).get('/api/customers?page=999').set(authHeader()).expect(200);
    expect(clamped.body.pagination).toEqual({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
  });
});
