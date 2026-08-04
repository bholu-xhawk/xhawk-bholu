import { expect, test } from '@playwright/test';

test('navigates from Home to About', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await page.getByRole('link', { name: 'About' }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
});
