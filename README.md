# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

## Testing

This monorepo uses pnpm workspaces under `apps/*`.

- Install dependencies: `pnpm install`

### Unit/Integration tests
- Run all unit tests across apps (Jest): `pnpm test` or `pnpm run test:unit`
- Run web unit tests only: `pnpm -C apps/web test`
- Run API tests only: `pnpm -C apps/api test`

### Web end-to-end tests (Playwright)
Playwright is scaffolded in `apps/web` with tests skipped by default.

- One-time local setup to install browsers: `pnpm -C apps/web exec playwright install`
- Run e2e tests: `pnpm run test:e2e` (from repo root) or `pnpm -C apps/web test:e2e`
- To enable the example test, open `apps/web/e2e/example.spec.js` and remove `test.skip(...)`.
- Optionally start the dev server before running e2e: `pnpm -C apps/web dev`.
  - Alternatively build and preview: `pnpm -C apps/web build && pnpm -C apps/web preview`

