import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../src/server.js';

describe('Accordion API', () => {
  it('GET /api/accordion returns backend-owned accordion items', async () => {
    const res = await request(app).get('/api/accordion').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([
      {
        id: 'backend-driven-content',
        title: 'Backend-driven content',
        description: 'Accordion titles and descriptions are served by the Express API.',
      },
      {
        id: 'client-side-toggle',
        title: 'Client-side toggle state',
        description: 'React keeps track of which accordion panels are currently open.',
      },
      {
        id: 'public-demo-route',
        title: 'Public demo route',
        description: 'The accordion endpoint is public and does not require database access.',
      },
    ]);
    res.body.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
    });
  });
});
