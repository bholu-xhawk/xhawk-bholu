import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

// Ensure a dedicated test DB and deterministic state
process.env.DATABASE_URL = `file:./test-${process.env.VITEST_POOL_ID || '0'}.db`;
process.env.JWT_SECRET = 'test-secret';

beforeAll(async () => {
  try {
    // Generate client and push schema. Using pnpm -C ensures workspace context
    execSync('npx prisma db push --force-reset', {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (err) {
    console.error('Prisma setup failed', err);
    throw err;
  }
});

afterAll(async () => {
  try {
    const mod = await import('../src/prisma.js');
    const prisma = mod.default || mod;
    await prisma.$disconnect();
  } catch {}
  try {
    rmSync(`./test-${process.env.VITEST_POOL_ID || '0'}.db`, { force: true });
  } catch {}
});
