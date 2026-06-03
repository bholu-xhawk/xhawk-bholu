const http = require('http');
const { createServer } = require('../src/server');

function get(path, port) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ res, data }));
    });
    req.on('error', reject);
  });
}

(async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = address.port;

  try {
    const { res, data } = await get('/user', port);

    // Assertions
    if (res.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${res.statusCode}. Body: ${data}`);
    }
    const ct = res.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      throw new Error(`Expected application/json content-type, got ${ct}`);
    }
    let json;
    try {
      json = JSON.parse(data);
    } catch (e) {
      throw new Error(`Response not valid JSON: ${e.message}. Raw: ${data}`);
    }
    const expected = { id: 1, name: 'John Doe', email: 'john@example.com' };
    for (const [k, v] of Object.entries(expected)) {
      if (json[k] !== v) {
        throw new Error(`Field ${k} expected ${v}, got ${json[k]}`);
      }
    }

    console.log('PASS: GET /user returns expected JSON');
    server.close();
  } catch (err) {
    console.error('FAIL:', err.message);
    server.close(() => process.exit(1));
  }
})();
