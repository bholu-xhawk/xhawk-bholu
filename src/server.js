const http = require('http');
const fs = require('fs');
const path = require('path');

// In-memory store; resets on server restart.
let todos = [];
let nextId = 1;

function sendJson(res, status, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data)
  });
  res.end(data);
}

function sendText(res, status, text) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text)
  });
  res.end(text);
}

function readJson(req, res) {
  return new Promise((resolve) => {
    const MAX = 1 * 1024 * 1024; // 1MB
    let bytes = 0;
    let chunks = [];

    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX) {
        // Payload too large
        sendJson(res, 413, { error: 'Payload too large' });
        req.destroy();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }
      try {
        const obj = JSON.parse(raw);
        resolve(obj);
      } catch (e) {
        sendJson(res, 400, { error: 'Invalid JSON' });
        resolve(null);
      }
    });

    req.on('error', () => {
      sendJson(res, 400, { error: 'Invalid request' });
      resolve(null);
    });
  });
}

function parseIdFromPathname(pathname) {
  // Expect /api/todos/:id
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'todos') {
    const id = Number(parts[2]);
    if (Number.isInteger(id) && id > 0) return id;
  }
  return null;
}

function createServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;

    // API routes
    if (pathname === '/api/todos' && req.method === 'GET') {
      return sendJson(res, 200, todos);
    }

    if (pathname === '/api/todos' && req.method === 'POST') {
      const body = await readJson(req, res);
      if (body == null) return; // error already sent
      const text = body && typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) {
        return sendJson(res, 400, { error: 'text must be a non-empty string' });
      }
      const todo = { id: nextId++, text, completed: false };
      todos.push(todo);
      return sendJson(res, 201, todo);
    }

    if (pathname.startsWith('/api/todos/') && req.method === 'PUT') {
      const id = parseIdFromPathname(pathname);
      if (!id) return sendJson(res, 404, { error: 'Not found' });
      const idx = todos.findIndex(t => t.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Not found' });

      const body = await readJson(req, res);
      if (body == null) return; // error already sent

      if (body.text !== undefined) {
        if (typeof body.text !== 'string' || !body.text.trim()) {
          return sendJson(res, 400, { error: 'text must be a non-empty string' });
        }
        todos[idx].text = body.text.trim();
      }
      if (body.completed !== undefined) {
        if (typeof body.completed !== 'boolean') {
          return sendJson(res, 400, { error: 'completed must be a boolean' });
        }
        todos[idx].completed = body.completed;
      }
      return sendJson(res, 200, todos[idx]);
    }

    if (pathname.startsWith('/api/todos/') && req.method === 'DELETE') {
      const id = parseIdFromPathname(pathname);
      if (!id) return sendJson(res, 404, { error: 'Not found' });
      const idx = todos.findIndex(t => t.id === id);
      if (idx === -1) return sendJson(res, 404, { error: 'Not found' });
      todos.splice(idx, 1);
      res.writeHead(204);
      return res.end();
    }

    if (pathname === '/' || pathname === '/index.html') {
      const filePath = path.join(__dirname, 'public', 'index.html');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          return sendText(res, 500, 'Internal Server Error');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': data.length });
        res.end(data);
      });
      return;
    }

    if (pathname.startsWith('/api/')) {
      return sendJson(res, 404, { error: 'Not found' });
    }

    return sendText(res, 404, 'Not found');
  });

  return server;
}

module.exports = { createServer };
