import { test, expect } from '@playwright/test';

test.describe.skip('navigation', () => {
  test('shows Home heading on /', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  });
});
