# xhawk-bholu

Monorepo containing:
- API app (Express + Prisma) under `apps/api`
- Web app (React + Vite) under `apps/web`
- A small root script in `src/index.js`

Node.js 20 is required (see `.nvmrc`). This README covers prerequisites, setup, development, testing, and builds for each app.

## Prerequisites
- Node.js 20.x
  - With nvm: run `nvm use` at the repo root (the repo includes `.nvmrc` specifying `20`).
- A package manager: npm (examples below), or pnpm/yarn if you prefer
  - This repo includes `pnpm-workspace.yaml`; if using pnpm, you can substitute `pnpm` for `npm` in the commands.
- Git tooling

## Repository layout
- `apps/api`
  - Express API
  - Prisma schema: `apps/api/prisma/schema.prisma`
  - Example environment: `apps/api/.env.example`
  - Scripts: see `apps/api/package.json`
- `apps/web`
  - React app bootstrapped with Vite
  - Scripts: see `apps/web/package.json`
- `src/index.js`
  - Simple root script runnable via `npm start` from repository root
- `.nvmrc`
  - Node.js version pin (20)
- `pnpm-workspace.yaml`
  - Workspace definition for pnpm (optional)
- `docs/`
  - Internal documentation (see links at the end of this README)

## Setup
1) Ensure Node 20 is active
```
# at the repo root
nvm use
node -v   # should print v20.x
```

2) API app
```
cd apps/api
cp .env.example .env   # then update values as needed
# Ensure DATABASE_URL is set for Prisma (e.g., SQLite, Postgres, etc.)

# Install dependencies
npm install

# Generate Prisma client (required before running if schema changed)
npm run prisma:generate

# Optionally, apply or create dev migrations
a) npm run prisma:migrate      # interactive dev migration
b) npm run prisma:push         # push schema without migrations
c) npm run prisma:studio       # open Prisma Studio
```

3) Web app
```
cd apps/web
npm install
```

## Development
- API (default on http://localhost:3001)
```
cd apps/api
npm run dev   # starts nodemon on src/server.js
```
- Web (Vite dev server, default on http://localhost:5173)
```
cd apps/web
npm run dev
```

## Testing
- API (Vitest)
```
cd apps/api
npm test
```
- Web (Jest + jsdom)
```
cd apps/web
npm test
```

## Build
- Web
```
cd apps/web
npm run build
# Optionally preview production build
npm run preview
```
- API
  - No build step is defined (see `apps/api/package.json`). For production, run the server directly:
```
cd apps/api
npm start
```

## Environment and Prisma notes (API)
- Copy `apps/api/.env.example` to `apps/api/.env` and set required values:
  - `DATABASE_URL` (Prisma connection string)
  - `JWT_SECRET` (for auth routes)
  - `PORT` (optional; defaults to 3001)
- Useful Prisma commands (run in `apps/api`):
  - `npm run prisma:generate`
  - `npm run prisma:migrate`
  - `npm run prisma:push`
  - `npm run prisma:studio`

## Root script
- You can run the simple root script:
```
npm start
```

## Design flow diagram
```
┌─────────────────────┐          ┌─────────────────────┐
│ Developer machine   │          │ Environment (.env)  │
│ (Node.js v20 via    │          │ e.g. DATABASE_URL   │
│ .nvmrc)             │          └─────────────────────┘
└──────────┬──────────┘                         ▲
           │                                    │
           │                                    │
           │          ┌─────────────────────┐   │
           │          │ API app (Express)  │────┘
           │          │ scripts in          │
           │          │ apps/api/package.json│
           │          │ dev: nodemon        │
           │          │ Prisma client       │
           │          └──────────┬──────────┘
           │                     │
           │                     │ HTTP
           │                     ▼
           │          ┌─────────────────────┐
           │          │ Web app (React/Vite)│
           │          │ scripts in           │
           │          │ apps/web/package.json│
           │          │ dev: vite            │
           │          └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ src/index.js        │
│ (root script sample)│
└─────────────────────┘
```

## Notes
- Package manager: examples use npm. If you use pnpm or yarn, swap commands accordingly (`pnpm install`, `pnpm run dev`, etc.).
- Keep this README in sync with `apps/*/package.json` scripts and directory structure.

## Additional internal docs
- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)
- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
