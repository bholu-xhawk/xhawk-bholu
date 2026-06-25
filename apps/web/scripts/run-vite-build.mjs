#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// Attempt to run vite from local node_modules without relying on .bin symlinks
const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
if (!fs.existsSync(viteBin)) {
  console.error(`Vite binary not found at expected path: ${viteBin}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteBin, 'build', ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(result.status ?? 1);

