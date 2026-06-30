import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret';

let app;
let token;

describe('Carousel API', () => {
  beforeAll(async () => {
    execSync('pnpm -C . prisma:generate && pnpm -C . prisma:push', { stdio: 'inherit', env: process.env });
    const mod = await import('../src/server.js');
    app = mod.default || mod;

    const email = `user${Date.now()}@example.com`;
    const password = 'password123';

    // Signup
    await request(app)
      .post('/api/auth/signup')
      .send({ email, password })
      .expect(201);

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    token = loginRes.body.token;
  }, 60000);

  afterAll(() => {
    try { execSync('rm -f ./test.db'); } catch {}
  });

  it('GET /api/carousel-images returns empty initially', async () => {
    const res = await request(app).get('/api/carousel-images').expect(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/carousel-images creates images with default positions incrementing', async () => {
    const img1 = await request(app)
      .post('/api/carousel-images')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/1.jpg', title: 'One' })
      .expect(201);
    const img2 = await request(app)
      .post('/api/carousel-images')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/2.jpg', title: 'Two' })
      .expect(201);

    expect(img1.body.position).toBe(0);
    expect(img2.body.position).toBe(1);
  });

  it('PUT /api/carousel-images/:id updates and inactive images are filtered in public GET', async () => {
    // create
    const created = await request(app)
      .post('/api/carousel-images')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/3.jpg', title: 'Three' })
      .expect(201);

    // update to inactive and change caption
    await request(app)
      .put(`/api/carousel-images/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ caption: 'Hidden', isActive: false })
      .expect(200);

    const res = await request(app).get('/api/carousel-images').expect(200);
    expect(res.body.find((x) => x.id === created.body.id)).toBeUndefined();
  });

  it('PUT /api/carousel-images/reorder updates positions and GET reflects order', async () => {
    // Make two new ones to reorder
    const a = await request(app)
      .post('/api/carousel-images')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/a.jpg', title: 'A' })
      .expect(201);
    const b = await request(app)
      .post('/api/carousel-images')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/b.jpg', title: 'B' })
      .expect(201);

    await request(app)
      .put('/api/carousel-images/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [
        { id: a.body.id, position: 2 },
        { id: b.body.id, position: 1 },
      ]})
      .expect(200);

    const res = await request(app).get('/api/carousel-images').expect(200);
    // Filter active ones including a and b and check order by position asc
    const ids = res.body.map((x) => x.id);
    const idxA = ids.indexOf(a.body.id);
    const idxB = ids.indexOf(b.body.id);
    expect(idxB).toBeLessThan(idxA);
  });

  it('DELETE /api/carousel-images/:id removes item', async () => {
    const toDelete = await request(app)
      .post('/api/carousel-images')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://example.com/delete.jpg' })
      .expect(201);

    await request(app)
      .delete(`/api/carousel-images/${toDelete.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const res = await request(app).get('/api/carousel-images').expect(200);
    expect(res.body.find((x) => x.id === toDelete.body.id)).toBeUndefined();
  });
});

