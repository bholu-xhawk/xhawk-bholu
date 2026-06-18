# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

## Local development setup

Get the backend (Express + Prisma) and frontend (Vite + React) running locally with the steps below. This repository uses a pnpm workspace.

### Prerequisites
- Node.js 20 (see .nvmrc)
  - If you use nvm: `nvm install && nvm use`
- pnpm installed globally
  - `npm i -g pnpm`
- Optional: curl (or a browser) to verify the API health endpoint

Note: pnpm is the recommended workflow. If you prefer npm, use it per-package (do not run npm/yarn at the workspace root).

### Install dependencies (workspace)
- From the repo root:
  ```sh
  pnpm install
  ```
- npm alternative (per package):
  ```sh
  cd apps/api && npm install
  cd ../web && npm install
  ```

### Configure environment (API)
- Copy the example env file and adjust if needed:
  ```sh
  cp apps/api/.env.example apps/api/.env
  ```
- Variables:
  - `JWT_SECRET` – secret for signing JWTs (development value is fine locally)
  - `DATABASE_URL` – defaults to a local SQLite DB, e.g. `file:./dev.db`
  - `PORT` – API port (defaults to `3001`)
- Do not commit `apps/api/.env`.

### Database (Prisma)
Generate the Prisma client and apply development migrations from the API package:
```sh
pnpm --filter ./apps/api run prisma:generate
pnpm --filter ./apps/api run prisma:migrate
```
This will create a local SQLite database at the path defined by `DATABASE_URL` in `apps/api/.env`.

### Run the backend (API)
- Using pnpm (recommended):
  ```sh
  pnpm --filter ./apps/api dev
  ```
  The API listens on http://localhost:3001 by default. Override with `PORT` in `apps/api/.env`.
- npm alternative:
  ```sh
  cd apps/api && npm run dev
  ```

### Verify API health
Check the health endpoint before starting the web app:
```sh
curl http://localhost:3001/api/health
```
You should get HTTP 200 with a JSON body like `{ "status": "ok" }`. You can also open the URL in a browser.

### Run the frontend (Web)
- Using pnpm (recommended):
  ```sh
  pnpm --filter ./apps/web dev
  ```
  Vite serves the app at http://localhost:5173 by default.
- npm alternative:
  ```sh
  cd apps/web && npm run dev
  ```

### Troubleshooting
- Port conflicts
  - If `3001` is in use for the API, set a different `PORT` in `apps/api/.env` (e.g., `PORT=3002`).
  - If `5173` is in use for Vite, run with a different port, e.g.: `pnpm --filter ./apps/web dev -- --port 5174` (or `npm run dev -- --port 5174`).
- Node version
  - Ensure Node 20 is active: `nvm use`
- Package manager
  - Use pnpm at the workspace root to install dependencies and run workspace-aware commands. Avoid mixing package managers at the root.

