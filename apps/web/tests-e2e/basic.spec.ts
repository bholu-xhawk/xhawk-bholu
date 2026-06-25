import { test, expect } from '@playwright/test';

// Basic navigation smoke test
// Assumes the app has routes for Home (/) and About (/about) with <h1> headings

test('navigate Home -> About', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible();

  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
});
