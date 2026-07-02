// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'apps/web/e2e',
  use: {
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'pnpm -C apps/web run build && pnpm -C apps/web run preview --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 120 * 1000
  }
});
