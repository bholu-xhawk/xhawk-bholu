import { test, expect } from '@playwright/test';

test('smoke: page loads and body is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});
