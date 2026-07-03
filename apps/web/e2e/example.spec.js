import { test, expect } from '@playwright/test';

// This example E2E is skipped by default to keep CI lean.
// Remove `.skip` locally to try it out after starting the dev server.
//   1) pnpm -C apps/web exec playwright install
//   2) pnpm -C apps/web dev
//   3) pnpm -C apps/web test:e2e

test.skip('home page shows Home heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /home/i })).toBeVisible();
});
