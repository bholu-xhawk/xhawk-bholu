# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

## E2E tests (Playwright)

We use Playwright for browser end-to-end tests.

Local quickstart:
- pnpm -w install
- pnpm -w run e2e:install
- pnpm -w run e2e:test

Notes:
- Tests live under `e2e/` at the repo root and should be named `*.spec.{js,ts}`.
- The test runner starts both the web app (Vite dev server on 5173) and API (Express on 3001).
- CI workflow: `.github/workflows/e2e.yml` runs the same commands on push/PR.

