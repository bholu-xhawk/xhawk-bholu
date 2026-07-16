# End-to-End Testing

This workspace uses Playwright for browser and API smoke tests. The test harness lives with the Vite/React app under `apps/web`.

## Local setup

From the repository root:

```sh
pnpm install
pnpm --filter web exec playwright install chromium
```

The browser binaries are installed locally by Playwright and are not committed to the repository.

## Running tests

Run the full E2E suite from the repository root:

```sh
pnpm e2e
```

That delegates to the web app's `test:e2e` script, which builds the Vite app and then starts the Playwright-managed Vite preview and Express API servers.

For interactive local debugging, use one of the web app scripts:

```sh
pnpm --filter web test:e2e:ui
pnpm --filter web test:e2e:headed
```

## Test locations

- Browser navigation tests live in `apps/web/e2e/navigation.spec.js`.
- API smoke tests live in `apps/web/e2e/api-health.spec.js`.
- Playwright configuration lives in `apps/web/playwright.config.js`.

Browser tests should prefer user-facing locators such as roles, labels, and visible text over CSS selectors. This keeps the suite focused on behavior and avoids coupling tests to styling implementation details.

## Adding API smoke tests

Playwright starts the Express API on `http://127.0.0.1:3001` for the suite. API smoke tests can use Playwright's `request` fixture and should avoid database-backed routes unless the test also provisions the required database, migrations, and seed data.
