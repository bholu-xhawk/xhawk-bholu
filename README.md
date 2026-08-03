# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## E2E Testing

The workspace uses Playwright from the repo root to coordinate the Vite web app and Express API. The API server startup generates the Prisma client, but the smoke test stays on `/api/health` and does not require database fixtures.

```sh
pnpm install
pnpm exec playwright install
pnpm test:e2e
```

Use `pnpm test:e2e:ui` for the Playwright UI runner, or `pnpm test:e2e:headed` to run the browser headed. By default the harness serves the web app at `http://127.0.0.1:4173` and the API at `http://127.0.0.1:3001`; override them with `WEB_BASE_URL` and `API_BASE_URL` when running against already-started local services.

The initial suite covers the Home-to-About browser flow, direct `/about` loading, and the `/api/health` smoke endpoint. Auth E2E coverage should wait until the web app exposes auth UI and the suite has an explicit test database lifecycle.

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

