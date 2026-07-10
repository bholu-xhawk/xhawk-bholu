import request from 'supertest';
import { execSync } from 'node:child_process';

process.env.DATABASE_URL = 'file:./debug.db';
process.env.JWT_SECRET = 'test-secret';

async function main() {
  try { execSync('rm -f ./debug.db'); } catch {}
  execSync('npm run prisma:generate && npm run prisma:push', { stdio: 'inherit', env: process.env });
  const mod = await import('../src/server.js');
  const app = mod.default || mod;
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'a@example.com', password: 'password123', name: 'A' });
  console.log('Status:', res.statusCode);
  console.log('Body:', res.body);
}
main().catch(err => { console.error(err); process.exit(1); });
