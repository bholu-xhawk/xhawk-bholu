import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

function databasePaths(filename) {
  return [join(process.cwd(), filename), join(process.cwd(), 'prisma', filename)];
}

export function resetTestDatabase(filename) {
  for (const path of databasePaths(filename)) {
    rmSync(path, { force: true });
  }

  process.env.DATABASE_URL = `file:./${filename}`;
  execSync('npm run prisma:generate && npm run prisma:push', {
    stdio: 'inherit',
    env: process.env,
  });
}

export function cleanupTestDatabase(filename) {
  for (const path of databasePaths(filename)) {
    rmSync(path, { force: true });
  }
}
