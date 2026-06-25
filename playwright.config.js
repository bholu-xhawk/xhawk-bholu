// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * See https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: 'e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /** Maximum time expect() should wait for the condition to be met. */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Start both web and api servers before running tests */
  webServer: [
    {
      command: 'pnpm -C apps/web run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 120 * 1000,
      url: 'http://localhost:5173',
    },
    {
      command: 'pnpm -C apps/api run start',
      port: 3001,
      reuseExistingServer: true,
      timeout: 120 * 1000,
      url: 'http://localhost:3001/api/health',
    },
  ],
});
