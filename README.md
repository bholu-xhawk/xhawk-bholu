# xhawk-bholu

A JavaScript/Node.js workspace with a small Express API, a React/Vite web app, automated tests, Playwright browser smoke tests, and internal engineering flow documentation.

## Repository layout

```text
.
├── apps/
│   ├── api/                 # Express API with Prisma, SQLite, auth, and user routes
│   └── web/                 # React + Vite frontend with Jest and Playwright tests
├── docs/                    # Internal agent/system flow documentation
├── src/                     # Root Node.js entry point
├── package.json             # Root workspace metadata and scripts
├── pnpm-workspace.yaml      # pnpm workspace package globs
└── README.md
```

## Requirements

- Node.js 20 or newer (`.nvmrc` pins Node 20 for CI/local use)
- pnpm 9 (CI uses `pnpm/action-setup@v4` with version 9)
- Chromium for Playwright E2E tests

If pnpm is not installed locally, enable it through Corepack:

```sh
corepack enable
corepack prepare pnpm@9 --activate
```

## Getting started

Install all workspace dependencies from the repository root:

```sh
pnpm install
```

Run the root start script:

```sh
pnpm start
```

The current root entry point is `src/index.js`.

## API app

The API package lives in `apps/api` and uses Express, Prisma, SQLite, JWT authentication, bcrypt password hashing, and Zod request validation.

### Environment

Copy the example environment file before running API commands locally:

```sh
cp apps/api/.env.example apps/api/.env
```

Default values:

- `PORT=3001`
- `JWT_SECRET=dev-secret`
- `DATABASE_URL="file:./dev.db"`

### API commands

Run these from the repository root:

```sh
pnpm --filter @workspace/api dev              # start API with nodemon
pnpm --filter @workspace/api start            # start API with node
pnpm --filter @workspace/api prisma:generate  # generate Prisma client
pnpm --filter @workspace/api prisma:migrate   # run development migrations
pnpm --filter @workspace/api prisma:push      # sync schema to database
pnpm --filter @workspace/api prisma:studio    # open Prisma Studio
pnpm --filter @workspace/api test             # run API tests
```

### API routes

- `GET /api/health` returns `{ "status": "ok" }`
- `POST /api/auth/signup` creates a user
- `POST /api/auth/login` returns a JWT
- Authenticated user routes under `/api/users` support list, read, create, update, and delete operations

Protected routes expect an authorization header in this format:

```text
Authorization: Bearer <token>
```

## Web app

The web package lives in `apps/web` and uses React, React Router, Vite, Tailwind CSS, Jest, Testing Library, ESLint, Prettier, and Playwright.

### Web commands

Run these from the repository root:

```sh
pnpm --filter web dev      # start Vite dev server
pnpm --filter web build    # build production assets
pnpm --filter web preview  # preview production build
pnpm --filter web lint     # lint React source files
pnpm --filter web test     # run Jest tests
pnpm --filter web e2e      # run Playwright E2E tests
```

The app currently provides public navigation between `/` (`Home`) and `/about` (`About`).

## Testing

### Root checks

```sh
pnpm test
```

### API tests

```sh
pnpm --filter @workspace/api test
```

### Web unit tests

```sh
pnpm --filter web test
```

### Web E2E tests

The React web app in `apps/web` uses Playwright for browser smoke tests.

Before the first local browser run, install Chromium if it is not already installed:

```sh
pnpm --filter web exec playwright install chromium
```

Run the web app E2E suite from the repository root:

```sh
pnpm --filter web e2e
```

The Playwright config lives at `apps/web/playwright.config.js`. It starts the Vite dev server on `http://127.0.0.1:4173` and runs tests from `apps/web/e2e/`.

To add a new browser test, create a `*.spec.js` file under `apps/web/e2e/`. Prefer stable user-facing selectors such as `page.getByRole(...)` and visible text assertions over CSS selectors or implementation details.

## Continuous integration

GitHub Actions runs the Node CI workflow on pushes and pull requests. The workflow:

1. Checks out the repository.
2. Sets up pnpm 9 and Node.js from `.nvmrc`.
3. Installs dependencies with `pnpm install --frozen-lockfile`.
4. Installs Playwright Chromium for pull request runs.
5. Runs the root start and test scripts.
6. Runs the web Playwright E2E suite for pull request runs.

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Generated files

The repository ignores dependency folders, build outputs, coverage reports, environment files, logs, and Playwright artifacts such as `playwright-report/`, `test-results/`, and `blob-report/`.
