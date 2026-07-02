# Users API

This service already exposes full CRUD for users behind JWT authentication.

Base path: /api

Authentication
- All routes below require Authorization: Bearer <JWT> header
- Create an account via POST /api/auth/signup; obtain a token via POST /api/auth/login

Routes
- GET /api/users
  - List users
  - 200 OK: array of { id, email, name, createdAt, updatedAt }
- GET /api/users/:id
  - Read a single user by numeric id
  - 200 OK: { id, email, name, createdAt, updatedAt }
  - 400 if id is invalid; 404 if not found
- POST /api/users
  - Create a user
  - Body: { email: string (email), password: string (min 8), name?: string }
  - 201 Created: { id, email, name, createdAt, updatedAt }
  - 422 for validation errors or if email already in use; 500 if a duplicate slips between pre-check and create
- PUT /api/users/:id
  - Update a user (partial)
  - Body: { email?: string (email), password?: string (min 8), name?: string|null }
  - 200 OK: { id, email, name, createdAt, updatedAt }
  - 400 if id invalid; 404 if not found; 422 for validation errors or duplicate email
- DELETE /api/users/:id
  - Delete a user by id
  - 204 No Content
  - 400 if id invalid; 404 if not found

Implementation notes
- Passwords are hashed with bcrypt and never returned in responses
- Input validation is performed with Zod
- Persistence via Prisma User model (SQLite by default)

Local testing
- Run Prisma generate and push, then run tests:
  - pnpm -C apps/api prisma:generate && pnpm -C apps/api prisma:push
  - pnpm -C apps/api test
- Start the API locally:
  - pnpm -C apps/api start (or cd apps/api && node src/server.js)

Environment
- DATABASE_URL: Prisma datasource (SQLite by default)
- JWT_SECRET: Secret for JWT signing/verification