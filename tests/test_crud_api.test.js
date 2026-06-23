const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../src/server');

let server;
let baseUrl;

beforeEach(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

afterEach(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
  server = undefined;
});

async function fetchJson(path, options = {}) {
  const res = await fetch(baseUrl + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let bodyText = await res.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : undefined;
  } catch (_) {
    body = undefined;
  }
  return { res, body };
}

test('GET /api/items returns initial mocked items', async () => {
  const { res, body } = await fetchJson('/api/items');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length >= 1);
  assert.ok(body[0].id);
  assert.ok(body[0].name);
});

test('CRUD flow for /api/items', async () => {
  // Create
  const createPayload = { name: 'New Item', extra: 'field' };
  const create = await fetchJson('/api/items', { method: 'POST', body: JSON.stringify(createPayload) });
  assert.strictEqual(create.res.status, 201);
  assert.ok(create.body.id);
  assert.strictEqual(create.body.name, 'New Item');
  assert.strictEqual(create.body.extra, 'field');
  const id = create.body.id;

  // Get by id
  const get = await fetchJson(`/api/items/${id}`);
  assert.strictEqual(get.res.status, 200);
  assert.strictEqual(get.body.id, id);
  assert.strictEqual(get.body.name, 'New Item');

  // Update item (id immutable)
  const updatePayload = { name: 'Updated Name', id: 'hacked' };
  const update = await fetchJson(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(updatePayload) });
  assert.strictEqual(update.res.status, 200);
  assert.strictEqual(update.body.id, id);
  assert.strictEqual(update.body.name, 'Updated Name');

  // Delete item
  const del = await fetchJson(`/api/items/${id}`, { method: 'DELETE' });
  assert.strictEqual(del.res.status, 204);
  assert.strictEqual(del.body, undefined); // no body expected

  // Subsequent get should 404
  const after = await fetchJson(`/api/items/${id}`);
  assert.strictEqual(after.res.status, 404);
});
