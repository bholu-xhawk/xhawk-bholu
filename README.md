# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## E2E testing

The React web app in `apps/web` uses Playwright for browser smoke tests.

1. Install workspace dependencies from the repository root:

   ```sh
   pnpm install
   ```

2. Before the first local or CI browser run, install Chromium if it is not already installed:

   ```sh
   pnpm --filter web exec playwright install chromium
   ```

3. Run the web app E2E suite from the repository root:

   ```sh
   pnpm --filter web e2e
   ```

The Playwright config lives at `apps/web/playwright.config.js`. It starts the Vite dev server on `http://127.0.0.1:4173` and runs tests from `apps/web/e2e/`.

To add a new browser test, create a `*.spec.js` file under `apps/web/e2e/`. Prefer stable user-facing selectors such as `page.getByRole(...)` and visible text assertions over CSS selectors or implementation details.

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
