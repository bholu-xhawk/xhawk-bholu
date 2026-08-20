import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

const databaseFile = `booklist-${process.pid}.test.db`;
process.env.DATABASE_URL = `file:./${databaseFile}`;
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;

const books = [
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', publicationDate: new Date('1969-03-01T00:00:00.000Z') },
  { title: 'Kindred', author: 'Octavia E. Butler', publicationDate: new Date('1979-06-01T00:00:00.000Z') },
  { title: 'Beloved', author: 'Toni Morrison', publicationDate: new Date('1987-09-02T00:00:00.000Z') },
];

describe('Booklist API', () => {
  beforeAll(async () => {
    try { execSync(`rm -f ./${databaseFile} ./prisma/${databaseFile}`); } catch {}
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const serverMod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = serverMod.default || serverMod;
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  beforeEach(async () => {
    await prisma.book.deleteMany();
    await prisma.book.createMany({ data: books });
  });

  afterEach(async () => {
    try { await prisma.book.deleteMany(); } catch {}
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    try { execSync(`rm -f ./${databaseFile} ./prisma/${databaseFile}`); } catch {}
  });

  it('GET /api/booklist returns the default page sorted by title', async () => {
    const res = await request(app).get('/api/booklist').expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        totalItems: 3,
        totalPages: 1,
        sortBy: 'title',
        sortDirection: 'asc',
      })
    );
    expect(res.body.items).toHaveLength(3);
    expect(res.body.items.map((book) => book.title)).toEqual(['Beloved', 'Kindred', 'The Left Hand of Darkness']);
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'Beloved',
        author: 'Toni Morrison',
        publicationDate: '1987-09-02T00:00:00.000Z',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    );
  });

  it('sorts by each supported field and direction', async () => {
    const authorRes = await request(app).get('/api/booklist?sortBy=author&sortDirection=asc').expect(200);
    expect(authorRes.body.items.map((book) => book.author)).toEqual([
      'Octavia E. Butler',
      'Toni Morrison',
      'Ursula K. Le Guin',
    ]);

    const dateRes = await request(app).get('/api/booklist?sortBy=publicationDate&sortDirection=desc').expect(200);
    expect(dateRes.body.items.map((book) => book.title)).toEqual(['Beloved', 'Kindred', 'The Left Hand of Darkness']);

    const titleRes = await request(app).get('/api/booklist?sortBy=title&sortDirection=desc').expect(200);
    expect(titleRes.body.items.map((book) => book.title)).toEqual(['The Left Hand of Darkness', 'Kindred', 'Beloved']);
  });

  it('returns pagination metadata and clamps oversized pageSize values', async () => {
    const pageTwo = await request(app).get('/api/booklist?page=2&pageSize=2').expect(200);
    expect(pageTwo.body).toEqual(
      expect.objectContaining({
        page: 2,
        pageSize: 2,
        totalItems: 3,
        totalPages: 2,
      })
    );
    expect(pageTwo.body.items.map((book) => book.title)).toEqual(['The Left Hand of Darkness']);

    const clamped = await request(app).get('/api/booklist?pageSize=500').expect(200);
    expect(clamped.body.pageSize).toBe(100);
  });

  it('rejects invalid query parameters', async () => {
    await request(app).get('/api/booklist?page=0').expect(400, { error: 'page must be a positive integer' });
    await request(app).get('/api/booklist?pageSize=abc').expect(400, { error: 'pageSize must be a positive integer' });
    await request(app).get('/api/booklist?sortBy=id').expect(400, { error: 'sortBy must be one of title, author, publicationDate' });
    await request(app).get('/api/booklist?sortDirection=sideways').expect(400, { error: 'sortDirection must be asc or desc' });
  });

  it('returns a stable error when Prisma fails', async () => {
    await prisma.$executeRawUnsafe('DROP TABLE "Book"');

    const res = await request(app).get('/api/booklist');
    execSync('pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to load booklist' });
  });
});
