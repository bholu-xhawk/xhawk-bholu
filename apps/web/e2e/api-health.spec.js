import { expect, test } from '@playwright/test';

test('API health endpoint reports ok', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:3001/api/health');

  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});
