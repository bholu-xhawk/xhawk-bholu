# xhawk-bholu

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## API quickstart

- POST /api/auth/signup { email, password, name? } -> 201, { user, accessToken, refreshToken }
- POST /api/auth/login { email, password } -> 200, { user, accessToken, refreshToken }
- POST /api/auth/refresh { refreshToken } -> 200, { user, accessToken, refreshToken }
- GET /api/users/me (Bearer access token) -> 200, { user }
- PATCH /api/users/me (Bearer) { email?, name? } -> 200, { user }
- DELETE /api/users/me (Bearer) -> 204

Error semantics:
- 400: malformed JSON or missing Authorization header
- 422: validation issues, uniqueness conflicts, token invalid/expired
- 404: resource not found (user not found, invalid credentials)
