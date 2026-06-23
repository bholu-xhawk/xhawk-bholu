import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  /* Start the Vite dev server for the web app */
  webServer: {
    command: 'npm run dev -- --port=5173',
    port: 5173,
    reuseExistingServer: true,
    cwd: 'apps/web',
    timeout: 120 * 1000,
  },
});
