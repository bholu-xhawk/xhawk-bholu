import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../src/server.js';

describe('Books API', () => {
  it('GET /api/books returns the public book catalog', async () => {
    const res = await request(app).get('/api/books').expect(200);

    expect(res.body).toEqual(expect.any(Array));
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        author: expect.any(String),
        year: expect.any(Number),
      })
    );
  });

  it('GET /api/books does not require authorization', async () => {
    const res = await request(app).get('/api/books').expect(200);

    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Pride and Prejudice' }),
      ])
    );
  });
});
