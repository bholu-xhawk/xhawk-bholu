const request = require('supertest');
const { execSync } = require('node:child_process');

process.env.DATABASE_URL = 'file:./test-auth.db';
process.env.JWT_SECRET = 'test-secret';

async function main() {
  try { execSync('rm -f ./test-auth.db'); } catch {}
  execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env, cwd: '/workspace/apps/api' });
  const app = require('../src/server.js');
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'a@example.com', password: 'password123', name: 'A' });
  console.log('Status:', res.statusCode);
  console.log('Body:', res.body);
}
main().catch(err => { console.error(err); process.exit(1); });
