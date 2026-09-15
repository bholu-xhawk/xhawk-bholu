import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../src/server.js';

describe('Todos API', () => {
  it('GET /api/todos returns a public static todo list', async () => {
    const res = await request(app).get('/api/todos').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    res.body.forEach((todo) => {
      expect(todo).toEqual({
        id: expect.any(Number),
        title: expect.any(String),
        completed: expect.any(Boolean),
      });
    });
  });
});
