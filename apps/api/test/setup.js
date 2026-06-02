import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import prisma from '../src/prisma.js';

// Ensure a dedicated test DB and deterministic state
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

beforeAll(async () => {
  try {
    // Generate client and push schema. Using pnpm -C ensures workspace context
    execSync('npx prisma generate && npx prisma db push', {
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
    await prisma.$disconnect();
  } catch {}
  try {
    execSync('rm -f ./test.db');
  } catch {}
});
