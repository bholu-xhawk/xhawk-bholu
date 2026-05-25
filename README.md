# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)

## REST API

This project includes a simple REST API for user authentication and CRUD using Express, SQLite, bcrypt, and JWT.

Base path: /api

- POST /api/auth/signup
  - Body: { email: string, password: string, name: string }
  - Responses:
    - 201: { id, email, name }
    - 422: { error: 'duplicate_email' | 'invalid_email' | 'invalid_password' | 'invalid_name', message }

- POST /api/auth/login
  - Body: { email: string, password: string }
  - Responses:
    - 200: { token, user: { id, email, name } }
    - 422: { error: 'invalid_credentials', message }

- GET /api/users
  - Requires Authorization: Bearer <token>
  - Responses:
    - 200: [ { id, email, name } ]
    - 400: { error: 'bad_request', message }

- GET /api/users/:id
  - Requires Authorization: Bearer <token>
  - Responses:
    - 200: { id, email, name }
    - 404: { error: 'not_found', message }
    - 422: { error: 'forbidden' | 'invalid_id', message }

- PUT /api/users/:id
  - Requires Authorization: Bearer <token>
  - Body: Partial { name?: string, email?: string }
  - Responses:
    - 200: { id, email, name }
    - 422: { error: 'forbidden' | 'invalid_id' | 'duplicate_email', message }
    - 404: { error: 'not_found', message }

- DELETE /api/users/:id
  - Requires Authorization: Bearer <token>
  - Responses:
    - 204: No content
    - 422: { error: 'forbidden' | 'invalid_id', message }
    - 404: { error: 'not_found', message }

Errors are returned as JSON with appropriate status codes (400/404/422).

