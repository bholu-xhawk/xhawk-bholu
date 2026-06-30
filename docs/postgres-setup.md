PostgreSQL setup for API

Prereqs
- Docker installed
- pnpm installed

Steps
1. Start Postgres locally
   docker compose -f apps/api/docker-compose.postgres.yml up -d

2. Configure environment
   Copy apps/api/.env.example to apps/api/.env and set DATABASE_URL to your Postgres URL, e.g.
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/workspace?schema=public"

3. Generate Prisma client for Postgres
   pnpm -C apps/api prisma:generate:pg

4. Push schema to database
   pnpm -C apps/api prisma:push:pg
   # Or use migrations
   pnpm -C apps/api prisma:migrate:pg

5. Inspect database (optional)
   pnpm -C apps/api prisma:studio

Notes
- The repository still defaults to SQLite for quick dev/tests. To use Postgres in dev, set the DATABASE_URL to a Postgres URL and use the :pg scripts.
- Roles are stored on the User model via a Role enum with values ADMIN, USER, GUEST. The first-ever signup may set role (e.g., ADMIN) for bootstrap; subsequent public signups default to USER.
