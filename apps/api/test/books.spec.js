import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;

describe('Books API', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const serverMod = await import('../src/server.js');
    const prismaMod = await import('../src/prisma.js');
    app = serverMod.default || serverMod;
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  beforeEach(async () => {
    await prisma.book.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('GET /api/books/:id returns a seeded book', async () => {
    const book = await prisma.book.create({
      data: {
        title: 'The Left Hand of Darkness',
        author: 'Ursula K. Le Guin',
        description: 'A science fiction classic.',
        publishedYear: 1969,
      },
    });

    const res = await request(app).get(`/api/books/${book.id}`).expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: book.id,
        title: 'The Left Hand of Darkness',
        author: 'Ursula K. Le Guin',
        description: 'A science fiction classic.',
        publishedYear: 1969,
      })
    );
    expect(res.body).toHaveProperty('createdAt');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('GET /api/books/:id returns 400 for invalid ids', async () => {
    await request(app).get('/api/books/not-a-number').expect(400);
    await request(app).get('/api/books/0').expect(400);
  });

  it('GET /api/books/:id returns 404 for missing books', async () => {
    await request(app).get('/api/books/9999').expect(404);
  });

  it('PUT /api/books/:id updates editable fields', async () => {
    const book = await prisma.book.create({
      data: { title: 'Old Title', author: 'Old Author', description: null, publishedYear: null },
    });

    const res = await request(app)
      .put(`/api/books/${book.id}`)
      .send({ title: 'New Title', author: 'New Author', description: 'Updated.', publishedYear: 2024 })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: book.id,
        title: 'New Title',
        author: 'New Author',
        description: 'Updated.',
        publishedYear: 2024,
      })
    );
  });

  it('PUT /api/books/:id returns 400 for invalid ids', async () => {
    await request(app).put('/api/books/nope').send({ title: 'Valid' }).expect(400);
  });

  it('PUT /api/books/:id validates payloads and returns 422', async () => {
    const book = await prisma.book.create({ data: { title: 'Valid Title', author: 'Valid Author' } });

    await request(app).put(`/api/books/${book.id}`).send({ title: '' }).expect(422);
    await request(app).put(`/api/books/${book.id}`).send({ publishedYear: '2024' }).expect(422);
  });

  it('PUT /api/books/:id returns 422 for empty payloads', async () => {
    const book = await prisma.book.create({ data: { title: 'Valid Title', author: 'Valid Author' } });

    await request(app).put(`/api/books/${book.id}`).send({}).expect(422);
  });

  it('PUT /api/books/:id returns 404 for missing books', async () => {
    await request(app).put('/api/books/9999').send({ title: 'New Title' }).expect(404);
  });
});
