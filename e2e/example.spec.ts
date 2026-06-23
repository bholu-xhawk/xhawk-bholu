import { test, expect } from '@playwright/test';

// Minimal smoke test to validate the Vite app boots and Home renders
// Assumes Home page has an <h1> with text 'Home'

test.describe('Home page', () => {
  test('renders Home heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
  });
});
