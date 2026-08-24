import { expect, test } from '@playwright/test';

test.describe('app shell', () => {
  test('shows the home page by default', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  });

  test('navigates to the about page from the app shell', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'About' }).click();

    await expect(page).toHaveURL('/about');
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  });
});
