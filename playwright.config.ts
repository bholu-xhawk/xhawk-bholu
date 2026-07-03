import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30000,
  reporter: 'list',
  // No webServer or browser projects yet; example test avoids page/browser usage
});
