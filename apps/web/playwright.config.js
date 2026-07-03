// @ts-check
// Basic Playwright config. Browsers are not installed by default in CI.
// Install locally with: pnpm -C apps/web exec playwright install

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Keep reporters minimal
  reporter: [['list']],
  // No webServer by default. You can run `pnpm -C apps/web dev` manually
  // and then unskip tests to run against localhost.
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    headless: true,
  },
});
