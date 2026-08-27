import { expect, test } from '@playwright/test';

test.describe('public navigation', () => {
  test('loads the home page and navigates to about', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.getByRole('link', { name: 'About' }).click();

    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  });
});
