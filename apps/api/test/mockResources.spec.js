import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

let app;

describe('Mock Resources API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  it('GET /api/resources returns a success envelope with mock resources', async () => {
    const res = await request(app)
      .get('/api/resources')
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: [
        {
          id: 1,
          name: 'Example resource',
          description: 'A deterministic mock resource for API clients.',
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          name: 'Archived example resource',
          description: 'A second mock resource showing another status.',
          status: 'archived',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
      message: 'Resources retrieved',
      meta: { count: 2 },
    });
  });

  it('GET /api/resources/:id returns a single mock resource', async () => {
    const res = await request(app)
      .get('/api/resources/1')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Resource retrieved');
    expect(res.body.data).toMatchObject({ id: 1, name: 'Example resource', status: 'active' });
  });

  it('POST /api/resources validates and returns a deterministic created resource', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({ name: 'Created resource', description: 'Created from a test', status: 'inactive' })
      .expect(201);

    expect(res.body).toEqual({
      success: true,
      data: {
        id: 3,
        name: 'Created resource',
        description: 'Created from a test',
        status: 'inactive',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      message: 'Resource created',
    });
  });

  it('PUT /api/resources/:id validates and returns a deterministic updated resource', async () => {
    const res = await request(app)
      .put('/api/resources/2')
      .send({ name: 'Updated resource', status: 'active' })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: {
        id: 2,
        name: 'Updated resource',
        description: 'A second mock resource showing another status.',
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      message: 'Resource updated',
    });
  });

  it('DELETE /api/resources/:id returns a success envelope with deletion confirmation', async () => {
    const res = await request(app)
      .delete('/api/resources/1')
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      data: { id: 1, deleted: true },
      message: 'Resource deleted',
    });
  });

  it('returns 400 with an error envelope for invalid resource ids', async () => {
    const res = await request(app)
      .get('/api/resources/not-an-id')
      .expect(400);

    expect(res.body).toEqual({
      success: false,
      error: { message: 'Invalid resource id' },
    });
  });

  it('returns 422 with validation details for invalid create payloads', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({ description: 'Missing a name' })
      .expect(422);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid input');
    expect(res.body.error.details.fieldErrors.name).toEqual(['Required']);
  });

  it('returns 422 with validation details for invalid update payloads', async () => {
    const res = await request(app)
      .put('/api/resources/1')
      .send({ status: 'unknown' })
      .expect(422);

    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid input');
    expect(res.body.error.details.fieldErrors.status).toEqual([
      "Invalid enum value. Expected 'active' | 'inactive' | 'archived', received 'unknown'",
    ]);
  });

  it('returns 404 with an error envelope for missing resources', async () => {
    const res = await request(app)
      .delete('/api/resources/999')
      .expect(404);

    expect(res.body).toEqual({
      success: false,
      error: { message: 'Resource not found' },
    });
  });
});
