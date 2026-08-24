# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

## Web end-to-end tests

The React/Vite app in `apps/web` has Playwright browser tests in `apps/web/e2e/`.

Install the frontend dependencies before running the suite:

```sh
npm --prefix apps/web install
```

Install Playwright's Chromium browser once for your local environment:

```sh
cd apps/web && npx playwright install --with-deps chromium
```

Run the headless E2E suite from the repository root:

```sh
npm --prefix apps/web run test:e2e
```

For interactive debugging, run Playwright UI mode:

```sh
npm --prefix apps/web run test:e2e:ui
```
