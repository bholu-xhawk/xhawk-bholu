#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const jestBin = path.join(process.cwd(), 'node_modules', 'jest', 'bin', 'jest.js');
if (!fs.existsSync(jestBin)) {
  console.error(`Jest binary not found at expected path: ${jestBin}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [jestBin], { stdio: 'inherit' });
process.exit(result.status ?? 1);
