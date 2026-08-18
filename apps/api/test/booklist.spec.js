import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

const databaseFile = `booklist-${process.pid}.test.db`;
process.env.DATABASE_URL = `file:./${databaseFile}`;
process.env.JWT_SECRET = 'test-secret';

let app;
let prisma;

const cleanupDb = () => {
  execSync(`rm -f ./${databaseFile} ./prisma/${databaseFile}`, { stdio: 'ignore' });
};

describe('Booklist API', () => {
  beforeAll(async () => {
    cleanupDb();
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    const prismaMod = await import('../src/prisma.js');
    prisma = prismaMod.default || prismaMod;
  }, 60000);

  afterAll(async () => {
    await prisma?.$disconnect();
    cleanupDb();
  });

  it('GET /api/booklist returns an empty list before books are created', async () => {
    const res = await request(app).get('/api/booklist').expect(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/booklist creates a valid book and GET /api/booklist/:id reads it', async () => {
    const created = await request(app)
      .post('/api/booklist')
      .send({
        title: 'Kindred',
        author: 'Octavia E. Butler',
        publishedYear: 1979,
        genre: 'Science fiction',
        isbn: '9780807083697',
        description: 'A time-travel novel about ancestry and survival.',
      })
      .expect(201);

    expect(created.body).toEqual(expect.objectContaining({
      id: expect.any(Number),
      title: 'Kindred',
      author: 'Octavia E. Butler',
      publishedYear: 1979,
      genre: 'Science fiction',
      isbn: '9780807083697',
      description: 'A time-travel novel about ancestry and survival.',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }));

    const fetched = await request(app).get(`/api/booklist/${created.body.id}`).expect(200);
    expect(fetched.body.title).toBe('Kindred');
  });

  it('GET /api/booklist lists books ordered by id', async () => {
    await request(app).post('/api/booklist').send({ title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin' }).expect(201);
    const res = await request(app).get('/api/booklist').expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.map((book) => book.id)).toEqual([...res.body.map((book) => book.id)].sort((a, b) => a - b));
  });

  it('POST /api/booklist rejects invalid payloads', async () => {
    await request(app)
      .post('/api/booklist')
      .send({ title: '', author: 'Missing Title' })
      .expect(422);
  });

  it('GET /api/booklist/:id validates ids and returns 404 for missing books', async () => {
    await request(app).get('/api/booklist/not-a-number').expect(400);
    await request(app).get('/api/booklist/99999').expect(404);
  });

  it('PUT /api/booklist/:id updates book metadata and validates payloads', async () => {
    const created = await request(app)
      .post('/api/booklist')
      .send({ title: 'Original Title', author: 'Original Author' })
      .expect(201);

    await request(app)
      .put(`/api/booklist/${created.body.id}`)
      .send({ publishedYear: 2024.5 })
      .expect(422);

    const updated = await request(app)
      .put(`/api/booklist/${created.body.id}`)
      .send({ title: 'Updated Title', genre: 'Fantasy', description: 'Updated description.' })
      .expect(200);

    expect(updated.body).toEqual(expect.objectContaining({
      title: 'Updated Title',
      author: 'Original Author',
      genre: 'Fantasy',
      description: 'Updated description.',
    }));
  });

  it('PUT and DELETE /api/booklist/:id return 404 for missing books', async () => {
    await request(app).put('/api/booklist/99999').send({ title: 'Missing' }).expect(404);
    await request(app).delete('/api/booklist/99999').expect(404);
  });

  it('DELETE /api/booklist/:id deletes books', async () => {
    const created = await request(app)
      .post('/api/booklist')
      .send({ title: 'Delete Me', author: 'Temporary Author' })
      .expect(201);

    await request(app).delete(`/api/booklist/${created.body.id}`).expect(204);
    await request(app).get(`/api/booklist/${created.body.id}`).expect(404);
  });
});
