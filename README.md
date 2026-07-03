# xhawk-bholu

## API (apps/api) — Run against PostgreSQL

Prerequisites:
- PostgreSQL running and accessible
- Node 20+, pnpm installed

Setup:
1. Install dependencies
   - pnpm install
2. Copy environment
   - cp apps/api/.env.example apps/api/.env
3. Set DATABASE_URL in apps/api/.env to your Postgres URL
   - Example: postgresql://postgres:postgres@localhost:5432/mydb?schema=public
4. Initialize the database schema with Prisma
   - pnpm -C apps/api prisma migrate dev
   - Optional: pnpm -C apps/api prisma generate

Start the API:
- Dev (with nodemon): pnpm run api:dev
- Prod-style: pnpm run api:start

Health checks:
- Server: curl http://localhost:3001/api/health -> {"status":"ok"}
- DB: curl http://localhost:3001/api/db/health -> {"db":"ok"}

Auth sanity-check:
- Signup: curl -X POST http://localhost:3001/api/auth/signup -H 'Content-Type: application/json' -d '{"email":"u@example.com","password":"password123"}'
- Login: curl -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"email":"u@example.com","password":"password123"}'

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

