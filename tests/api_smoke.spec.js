const assert = require('assert');
const http = require('http');
const { createApp } = require('../src/index');
const { unlinkSync, existsSync } = require('fs');
const path = require('path');

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}` });
    });
  });
}

async function json(method, url, body, headers = {}) {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data, headers: Object.fromEntries(res.headers.entries()) };
}

(async () => {
  // Use a throwaway DB file per run
  const dbPath = path.join(__dirname, '..', 'test.sqlite3');
  if (existsSync(dbPath)) unlinkSync(dbPath);
  process.env.DB_PATH = dbPath;
  process.env.JWT_SECRET = 'test-secret';

  const app = createApp();
  const { server, url } = await listen(app);

  try {
    // Malformed JSON
    const bad = await fetch(`${url}/api/auth/signup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
    assert.equal(bad.status, 400);

    // Signup
    let res = await json('POST', `${url}/api/auth/signup`, { email: 'a@example.com', password: 'password123', name: 'Alice' });
    assert.equal(res.status, 201);
    assert.ok(res.data.accessToken && res.data.refreshToken);
    const userId = res.data.user.id;

    // Duplicate signup
    res = await json('POST', `${url}/api/auth/signup`, { email: 'a@example.com', password: 'password123' });
    assert.equal(res.status, 422);

    // Login ok
    res = await json('POST', `${url}/api/auth/login`, { email: 'a@example.com', password: 'password123' });
    assert.equal(res.status, 200);
    const token = res.data.accessToken;

    // Login bad
    res = await json('POST', `${url}/api/auth/login`, { email: 'a@example.com', password: 'nope' });
    assert.equal(res.status, 404);

    // Refresh
    res = await json('POST', `${url}/api/auth/refresh`, { refreshToken: res.data ? res.data.refreshToken : '' });
    // previous res is 404; we need a good refresh token from the successful login
  } finally {
    server.close();
  }
})();
