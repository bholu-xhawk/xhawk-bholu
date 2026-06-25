# End-to-End tests (Playwright)

This repository uses Playwright for browser E2E tests, configured at the repo root.

- Test location: `e2e/`
- Naming: `*.spec.{js,ts}`
- Base URL: `http://localhost:5173` (Vite dev server)
- API expected at: `http://localhost:3001`

Example minimal test you can add later:

```ts
import { test, expect } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/'); // resolves against baseURL
  await expect(page).toHaveTitle(/.+/);
});
```

Useful patterns:
- Import helpers from a shared util file as needed.
- Use `test.use({ storageState: 'e2e/.auth/user.json' })` to test authenticated flows.
- `page.goto('/')` uses the configured `baseURL`.

Local quickstart:
- pnpm -w install
- pnpm -w run e2e:install
- pnpm -w run e2e:test

Other commands:
- `pnpm -w run e2e:ui` to use Playwright's UI mode
- `pnpm -w run e2e:codegen` to record a flow against the dev server
