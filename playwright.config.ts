import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/web/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm --prefix apps/web run preview:ci',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120000,
  },
  reporter: [
    ['html', { open: 'never' }],
    ['blob']
  ],
  outputDir: 'test-results',
});
