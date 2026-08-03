const { test, expect } = require('@playwright/test');

const apiBaseURL = process.env.API_BASE_URL || 'http://127.0.0.1:3001';

test('API health endpoint reports ok', async ({ request }) => {
  const response = await request.get(`${apiBaseURL}/api/health`);

  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});
