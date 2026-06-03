const http = require('http');

function createServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const { pathname } = url;

      // Simple routing
      if (req.method === 'GET' && pathname === '/user') {
        const payload = { id: 1, name: 'John Doe', email: 'john@example.com' };
        const body = JSON.stringify(payload);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', Buffer.byteLength(body));
        res.end(body);
        return;
      }

      // Fallback 404
      const notFound = JSON.stringify({ error: 'Not found' });
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(notFound));
      res.end(notFound);
    } catch (err) {
      // Basic error handling
      const msg = JSON.stringify({ error: 'Internal Server Error' });
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(msg));
      res.end(msg);
    }
  });

  return server;
}

function startServer(port) {
  const server = createServer();
  server.listen(port);
  return server;
}

module.exports = { createServer, startServer };