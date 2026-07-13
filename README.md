# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
- Todo API: [docs/todo_api.md](docs/todo_api.md)

## Running locally

- API: pnpm -C apps/api dev (defaults to port 3001)
- Web: pnpm -C apps/web dev (Vite dev proxy forwards /api to http://localhost:3001)

Visit /todos in the web app to use the Todo UI.

