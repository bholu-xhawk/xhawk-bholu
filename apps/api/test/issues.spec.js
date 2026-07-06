import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let app;

describe('Issues API (dummy pagination)', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  it('GET /api/issues returns default envelope with 10 items', async () => {
    const res = await request(app).get('/api/issues').expect(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('offset', 0);
    expect(res.body).toHaveProperty('limit', 10);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBe(10);
    // first item should have number 1
    expect(res.body.items[0]).toEqual(
      expect.objectContaining({ id: 1, number: 1, title: expect.any(String), state: expect.any(String), created_at: expect.any(String) })
    );
  });

  it('GET /api/issues with offset and limit slices correctly', async () => {
    const res = await request(app).get('/api/issues?offset=10&limit=5').expect(200);
    expect(res.body.items.length).toBe(5);
    // first item should correspond to number 11 (0-based offset)
    expect(res.body.items[0]).toEqual(expect.objectContaining({ id: 11, number: 11 }));
    expect(res.body).toHaveProperty('offset', 10);
    expect(res.body).toHaveProperty('limit', 5);
  });

  it('GET /api/issues with offset beyond end returns empty items', async () => {
    // total is 200 according to router, but don't assume; query large offset
    const first = await request(app).get('/api/issues').expect(200);
    const total = first.body.total;
    const res = await request(app).get(`/api/issues?offset=${total + 10}&limit=10`).expect(200);
    expect(res.body.items.length).toBe(0);
    expect(res.body.total).toBe(total);
    expect(res.body.offset).toBe(total); // clamped start equals total
  });

  it('GET /api/issues normalizes negative offset and caps limit at 100', async () => {
    const res = await request(app).get('/api/issues?offset=-5&limit=1000').expect(200);
    expect(res.body.offset).toBe(0);
    expect(res.body.limit).toBe(100);
    expect(res.body.items.length).toBeLessThanOrEqual(100);
  });
});
