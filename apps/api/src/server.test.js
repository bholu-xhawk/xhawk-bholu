const { execSync } = require('node:child_process');
const request = require('supertest');

let app;

describe('API health endpoint', () => {
  beforeAll(() => {
    execSync('npm run prisma:generate', { stdio: 'inherit' });
    app = require('./server');
  }, 60_000);

  it('returns ok status', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});
