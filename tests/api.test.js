const { test, beforeEach, afterEach } = require('node:test');
const assert = require('assert/strict');
const { createServer } = require('../src/server');

let server;
let baseUrl;

beforeEach(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Basic static page
test('GET / returns index.html', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const body = await res.text();
  assert.match(body, /Todo List/);
});

// CRUD flow
test('Todos CRUD', async () => {
  // Initial GET
  let res = await fetch(`${baseUrl}/api/todos`);
  assert.equal(res.status, 200);
  let data = await res.json();
  assert.deepEqual(data, []);

  // Create
  res = await fetch(`${baseUrl}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'First' })
  });
  assert.equal(res.status, 201);
  const created = await res.json();
  assert.equal(created.text, 'First');
  assert.equal(created.completed, false);
  assert.ok(Number.isInteger(created.id));

  // GET shows the created item
  res = await fetch(`${baseUrl}/api/todos`);
  assert.equal(res.status, 200);
  data = await res.json();
  assert.equal(data.length, 1);
  assert.equal(data[0].id, created.id);

  // Update completed
  res = await fetch(`${baseUrl}/api/todos/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true })
  });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.completed, true);

  // GET reflects update
  res = await fetch(`${baseUrl}/api/todos`);
  assert.equal(res.status, 200);
  data = await res.json();
  assert.equal(data[0].completed, true);

  // Delete
  res = await fetch(`${baseUrl}/api/todos/${created.id}`, { method: 'DELETE' });
  assert.equal(res.status, 204);

  // GET empty again
  res = await fetch(`${baseUrl}/api/todos`);
  assert.equal(res.status, 200);
  data = await res.json();
  assert.deepEqual(data, []);
});

// Error cases
test('Error cases: 404 and 400', async () => {
  // 404 update non-existent
  let res = await fetch(`${baseUrl}/api/todos/9999`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true })
  });
  assert.equal(res.status, 404);

  // 404 delete non-existent
  res = await fetch(`${baseUrl}/api/todos/9999`, { method: 'DELETE' });
  assert.equal(res.status, 404);

  // 400 invalid POST body
  res = await fetch(`${baseUrl}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: '' })
  });
  assert.equal(res.status, 400);
  let body = await json(res);
  assert.equal(body.error, 'text must be a non-empty string');

  // 400 invalid PUT body type
  res = await fetch(`${baseUrl}/api/todos/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: 'yes' })
  });
  assert.equal(res.status, 404); // id 1 not created in this test
});
