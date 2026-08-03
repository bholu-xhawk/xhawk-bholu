const { defineConfig } = require('@playwright/test');

const webBaseURL = process.env.WEB_BASE_URL || 'http://127.0.0.1:4173';
const apiBaseURL = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const reuseExistingServer = !process.env.CI;

module.exports = defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: webBaseURL,
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter web build && pnpm --filter web preview -- --host 127.0.0.1 --port 4173',
      url: webBaseURL,
      reuseExistingServer,
      timeout: 120000,
    },
    {
      command: 'pnpm --filter @workspace/api prisma:generate && pnpm --filter @workspace/api start',
      url: `${apiBaseURL}/api/health`,
      reuseExistingServer,
      timeout: 120000,
    },
  ],
});
