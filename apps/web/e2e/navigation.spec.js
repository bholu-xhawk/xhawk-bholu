import { expect, test } from '@playwright/test';

test('renders the Home page by default', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
});

test('navigates from Home to About', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'About' }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
});

test('renders the About page from a direct link', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
});
