# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

## Testing

This repo uses multiple test runners scoped to their areas:

- Root unit tests (Jest):
  - Run: `pnpm test:unit`
  - Scope: only files under `src/**` at the repository root
- Web app tests (Jest in apps/web):
  - Run: `pnpm --filter web test`
- API tests (Vitest in apps/api):
  - Run: `pnpm --filter @workspace/api test`

### End-to-end (Playwright)

- Basic E2E placeholder (no browser required): `pnpm test:e2e`
- To enable real browser-based E2E locally/CI later:
  1. Install browsers: `pnpm dlx playwright install`
  2. Extend `playwright.config.ts` to add `webServer` and browser projects as needed

