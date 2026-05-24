# API Service

A lightweight Express-based API providing authentication and user CRUD with role-based access control.

Base URL: http://localhost:3001

Auth
- POST /api/auth/signup
  - Request: { email: string, password: string, isAdmin?: boolean }
  - Responses:
    - 201 { token, user }
    - 400 for invalid payload
    - 422 for duplicate email
- POST /api/auth/login
  - Request: { email: string, password: string }
  - Responses:
    - 200 { token, user }
    - 400 for invalid payload
    - 422 for invalid credentials

Users
- GET /api/users (admin only)
  - Auth: Bearer token
  - Responses: 200 { users: User[] }, 401, 403
- GET /api/users/:id (self or admin)
  - Responses: 200 { user }, 401, 403, 404
- PATCH /api/users/:id (self or admin)
  - Request: { email?: string, password?: string, isAdmin?: boolean(admin only) }
  - Responses: 200 { user }, 400, 401, 403, 404, 422 (duplicate email)
- DELETE /api/users/:id (self or admin)
  - Responses: 204, 401, 403, 404

Error semantics
- 400 Bad Request for malformed or missing fields
- 401 Unauthorized for missing/invalid Bearer token
- 403 Forbidden for insufficient privileges
- 404 Not Found for missing resources
- 422 Unprocessable Entity for business rule violations (duplicate email, invalid credentials)

Local development
- Install deps: from repo root, run: npm install --workspaces or pnpm i
- Start API: npm run start:api (PORT env to override default 3001)
- JWT secret: set JWT_SECRET; a dev default is used if not provided
