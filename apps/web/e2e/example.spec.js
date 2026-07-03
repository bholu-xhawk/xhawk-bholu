// Example Playwright E2E test. Skipped by default so CI passes without browsers.
import { test, expect } from '@playwright/test';

test.skip('home page has expected title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Vite|React/i);
});
