const http = require('http');

function sendJson(res, statusCode, data) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (statusCode === 204) {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(data));
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not Found' });
}

function methodNotAllowed(res, allow) {
  res.writeHead(405, { 'Allow': allow });
  res.end();
}

function readJson(req, { limitBytes = 1_048_576 } = {}) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        const obj = raw.length ? JSON.parse(raw) : {};
        resolve(obj);
      } catch (e) {
        const err = new Error('Invalid JSON');
        err.statusCode = 400;
        reject(err);
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function createServer() {
  // In-memory data store scoped to this server instance
  const items = [{ id: '1', name: 'Mock Item 1' }];
  let nextId = 2;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;

    // Exact route for collection
    if (pathname === '/api/items') {
      if (req.method === 'GET') {
        // List items
        return sendJson(res, 200, items);
      }
      if (req.method === 'POST') {
        try {
          const body = await readJson(req);
          if (!body || typeof body.name !== 'string' || !body.name.trim()) {
            return sendJson(res, 400, { error: 'Field "name" is required' });
          }
          const item = { id: String(nextId++), name: body.name };
          // Include any extra fields provided except id
          for (const [k, v] of Object.entries(body)) {
            if (k !== 'id' && k !== 'name') {
              item[k] = v;
            }
          }
          items.push(item);
          return sendJson(res, 201, item);
        } catch (e) {
          const status = e && e.statusCode ? e.statusCode : 400;
          if (status === 413) {
            res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Payload too large' }));
            return;
          }
          return sendJson(res, status, { error: 'Invalid JSON' });
        }
      }
      return methodNotAllowed(res, 'GET, POST');
    }

    // Exact route for item by id: no trailing slash beyond /api/items/:id
    const idMatch = pathname.match(/^\/api\/items\/([^\/]+)$/);
    if (idMatch) {
      const id = idMatch[1];
      if (req.method === 'GET') {
        const found = items.find(i => i.id === id);
        if (!found) return notFound(res);
        return sendJson(res, 200, found);
      }
      if (req.method === 'PUT') {
        try {
          const body = await readJson(req);
          const idx = items.findIndex(i => i.id === id);
          if (idx === -1) return notFound(res);
          const current = items[idx];
          const updated = { ...current };
          for (const [k, v] of Object.entries(body || {})) {
            if (k === 'id') continue; // id immutable
            updated[k] = v;
          }
          items[idx] = updated;
          return sendJson(res, 200, updated);
        } catch (e) {
          const status = e && e.statusCode ? e.statusCode : 400;
          if (status === 413) {
            res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Payload too large' }));
            return;
          }
          return sendJson(res, status, { error: 'Invalid JSON' });
        }
      }
      if (req.method === 'DELETE') {
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return notFound(res);
        items.splice(idx, 1);
        return sendJson(res, 204);
      }
      return methodNotAllowed(res, 'GET, PUT, DELETE');
    }

    // Known base path but with trailing slash for id or collection should be 404
    if (pathname.startsWith('/api/items')) {
      // For unknown subpaths under /api/items return 404
      return notFound(res);
    }

    // Fallback 404
    return notFound(res);
  });

  return server;
}

function start(port = process.env.PORT || 3000) {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      const address = server.address();
      const boundPort = typeof address === 'object' && address ? address.port : port;
      console.log(`Server listening on port ${boundPort}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

module.exports = { createServer, start };
