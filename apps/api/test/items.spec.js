import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let app;

describe('Mock Items API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  it('GET /api/items returns mock items without auth', async () => {
    const res = await request(app).get('/api/items').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toMatchObject({
      id: expect.any(Number),
      name: expect.any(String),
      description: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('GET /api/items/:id returns one mock item', async () => {
    const res = await request(app).get('/api/items/1').expect(200);

    expect(res.body).toMatchObject({
      id: 1,
      name: 'Mock item 1',
      description: 'A sample mock item',
    });
  });

  it('GET /api/items/:id validates ids and returns 404 for missing items', async () => {
    await request(app).get('/api/items/not-an-id').expect(400, { error: 'Invalid id' });
    await request(app).get('/api/items/0').expect(400, { error: 'Invalid id' });
    await request(app).get('/api/items/999999').expect(404, { error: 'Item not found' });
  });

  it('POST /api/items creates a mock item', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Created item', description: 'Created in a test' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      name: 'Created item',
      description: 'Created in a test',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });

    await request(app).get(`/api/items/${res.body.id}`).expect(200);
  });

  it('POST /api/items validates payloads', async () => {
    await request(app).post('/api/items').send({ description: 'Missing name' }).expect(422, { error: 'Invalid input' });
    await request(app).post('/api/items').send({ name: '' }).expect(422, { error: 'Invalid input' });
    await request(app).post('/api/items').send({ name: 'Valid', description: 42 }).expect(422, { error: 'Invalid input' });
  });

  it('PUT /api/items/:id updates a mock item', async () => {
    const created = await request(app)
      .post('/api/items')
      .send({ name: 'Item to update', description: 'Before update' })
      .expect(201);

    const res = await request(app)
      .put(`/api/items/${created.body.id}`)
      .send({ name: 'Updated item', description: 'After update' })
      .expect(200);

    expect(res.body).toMatchObject({
      id: created.body.id,
      name: 'Updated item',
      description: 'After update',
      createdAt: created.body.createdAt,
      updatedAt: expect.any(String),
    });
  });

  it('PUT /api/items/:id validates ids and payloads and returns 404 for missing items', async () => {
    await request(app).put('/api/items/not-an-id').send({ name: 'Valid' }).expect(400, { error: 'Invalid id' });
    await request(app).put('/api/items/1').send({}).expect(422, { error: 'Invalid input' });
    await request(app).put('/api/items/1').send({ name: '' }).expect(422, { error: 'Invalid input' });
    await request(app).put('/api/items/999999').send({ name: 'Valid' }).expect(404, { error: 'Item not found' });
  });

  it('DELETE /api/items/:id removes a mock item', async () => {
    const created = await request(app)
      .post('/api/items')
      .send({ name: 'Item to delete', description: 'Deleted in a test' })
      .expect(201);

    await request(app).delete(`/api/items/${created.body.id}`).expect(204);
    await request(app).get(`/api/items/${created.body.id}`).expect(404, { error: 'Item not found' });
  });

  it('DELETE /api/items/:id validates ids and returns 404 for missing items', async () => {
    await request(app).delete('/api/items/not-an-id').expect(400, { error: 'Invalid id' });
    await request(app).delete('/api/items/999999').expect(404, { error: 'Item not found' });
  });
});
