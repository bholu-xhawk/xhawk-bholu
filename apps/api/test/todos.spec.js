import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

let app;
let store;

describe('Todos API', () => {
  beforeAll(async () => {
    const mod = await import('../src/server.js');
    app = mod.default || mod;
    const storeMod = await import('../src/store/todos.js');
    store = storeMod.default || storeMod;
  });

  beforeEach(() => {
    const dir = path.dirname(store.DATA_FILE);
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    fs.writeFileSync(store.DATA_FILE, '[]', 'utf8');
  });

  it('POST /api/todos creates a todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ text: 'Buy milk' })
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toMatchObject({ text: 'Buy milk', completed: false });
    expect(typeof res.body.createdAt).toBe('string');
  });

  it('GET /api/todos returns created item', async () => {
    await request(app).post('/api/todos').send({ text: 'Buy milk' });
    const res = await request(app).get('/api/todos').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].text).toBe('Buy milk');
  });

  it('PUT /api/todos/:id toggles completed', async () => {
    const created = await request(app).post('/api/todos').send({ text: 'Task' });
    const id = created.body.id;
    const res = await request(app)
      .put(`/api/todos/${id}`)
      .send({ completed: true })
      .expect(200);
    expect(res.body.completed).toBe(true);
  });

  it('DELETE /api/todos/:id removes the item', async () => {
    const created = await request(app).post('/api/todos').send({ text: 'Task' });
    const id = created.body.id;
    await request(app).delete(`/api/todos/${id}`).expect(204);
    const res = await request(app).get('/api/todos').expect(200);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/todos with empty text returns 422', async () => {
    await request(app)
      .post('/api/todos')
      .send({ text: '' })
      .expect(422);
  });
});
