import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../src/server.js';

describe('Mock users demo endpoint', () => {
  it('GET /users returns public mocked users', async () => {
    const res = await request(app)
      .get('/users')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toEqual([
      { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
      { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },
      { id: 3, name: 'Katherine Johnson', email: 'katherine@example.com' },
    ]);
    expect(res.body).toHaveLength(3);
    for (const user of res.body) {
      expect(user).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        email: expect.any(String),
      });
    }
  });
});
