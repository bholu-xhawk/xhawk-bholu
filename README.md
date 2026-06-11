# API Documentation

This repository includes a Node/Express API under `apps/api`. This README documents authentication and the available endpoints so you can start using the service immediately.

## Base URL & Health

- Base path: `/api`
- Health: `GET /api/health` → `{ "status": "ok" }`

## Authentication

- Mechanism: JWT Bearer tokens
- Obtain a token: `POST /api/auth/login` with `{ email, password }`
- Header for protected routes: `Authorization: Bearer <token>`
- Expiration: 7 days (`expiresIn: '7d'`)
- Signing secret: `process.env.JWT_SECRET` (falls back to `dev-secret` in development)

Environment variables (see `apps/api/.env.example`):
- `JWT_SECRET` — set in non-dev environments to a strong secret; defaults to `dev-secret` if unset
- `DATABASE_URL` — Prisma database connection string
- `PORT` — API port (default `3001`)

Validation uses Zod and returns `422` for invalid input with details.

Design flow

```
┌─────────────────────┐        ┌─────────────────────────┐
│ Client              │        │ API (Express app)       │
│ (e.g., curl)        │        │ apps/api/src/server.js  │
└─────────┬───────────┘        └──────────┬──────────────┘
          │ POST /api/auth/login          │
          │ { email, password }           │
          │──────────────────────────────▶│
          │                                │ generate JWT (7d)
          │ ◀──────────────────────────────│ { token }
          │                                │
          │  Authorization: Bearer <token> │
          │──────────────────────────────▶│ router.use(auth)
          │                                │ verifies JWT via
          │                                │ apps/api/src/middleware/auth.js
          │                                │
          │  GET/POST/PUT/DELETE /api/users…
          │──────────────────────────────▶│ users routes enforce auth
          │ ◀──────────────────────────────│ data / status codes
```

## API Endpoints

Auth
- POST `/api/auth/signup`
  - Body: `{ email (string, email), password (string, min 8), name (string, optional) }`
  - Responses:
    - `201` user `{ id, email, name, createdAt, updatedAt }`
    - `422` invalid input or email already in use
    - `500` on failure
- POST `/api/auth/login`
  - Body: `{ email (string, email), password (string, min 1) }`
  - Responses:
    - `200` `{ token }`
    - `400` invalid email or password
    - `422` invalid input

Users (all require `Authorization: Bearer <token>`) 
- GET `/api/users`
  - `200` array of users `{ id, email, name, createdAt, updatedAt }`
- GET `/api/users/:id`
  - `200` user
  - `400` invalid id
  - `404` not found
- POST `/api/users`
  - Body: `{ email (email), name (optional), password (min 8) }`
  - Responses:
    - `201` user
    - `422` invalid input or email in use
    - `500` on failure
- PUT `/api/users/:id`
  - Body: `{ email? (email), name? (nullable), password? (min 8) }`
  - Responses:
    - `200` updated user
    - `400` invalid id
    - `404` not found
    - `422` invalid input or duplicate email
    - `500` on failure
- DELETE `/api/users/:id`
  - `204` no content
  - `400` invalid id
  - `404` not found
  - `500` on failure

Other responses
- `401` Missing/invalid Authorization header (expected `Authorization: Bearer <token>`) or invalid/expired token
- `404` `{ error: 'Not found' }` for unknown `/api/*` routes

## Example usage (curl)

Login and capture token:

```
TOKEN=$(curl -sX POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}' \
  | jq -r .token)
```

Authenticated request:

```
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/users
```

Signup:

```
curl -sX POST http://localhost:3001/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

Create user (requires token):

```
curl -sX POST http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"email":"newuser@example.com","password":"password123","name":"New User"}'
```

Update user (nullable name example):

```
curl -sX PUT http://localhost:3001/api/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":null,"email":"updated@example.com"}'
```

Delete user:

```
curl -sX DELETE http://localhost:3001/api/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Manual setup

- Ensure `JWT_SECRET` is set in production; in development it defaults to `dev-secret` if unset
- Set `DATABASE_URL` to your Prisma database
- API listens on `PORT` (default `3001`); base path is `/api`

## Notes

- Validation rules and responses are enforced as in `apps/api/src/routes/*.js` using Zod.
- JWT verification and error handling are implemented in `apps/api/src/middleware/auth.js`.
- Health endpoint and base routing are in `apps/api/src/server.js`.

## Internal documentation

- Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)
- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

