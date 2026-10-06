# xhawk-bholu Todo Workspace

Full-stack todo app with an Express/Prisma API and a React/Vite web client. Users sign up or log in with JWT authentication, then manage a private persisted todo list.

## Prerequisites

- Node.js 20 or newer (`.nvmrc` pins Node 20)
- npm for the workspace scripts
- pnpm is optional; package scripts are available through npm workspaces

## Install

```sh
npm install
```

## API environment and database

The API lives in `apps/api` and uses Prisma with SQLite.

```sh
cp apps/api/.env.example apps/api/.env
npm --workspace @workspace/api run prisma:generate
npm --workspace @workspace/api run prisma:push
```

The default API settings are:

- `PORT=3001`
- `DATABASE_URL="file:./dev.db"`
- `JWT_SECRET=dev-secret`

## Development

Run the API and web app in separate terminals:

```sh
npm run dev:api
npm run dev:web
```

- API: `http://localhost:3001`
- Web: Vite's printed local URL, usually `http://localhost:5173`
- The web dev server proxies relative `/api` requests to `http://localhost:3001`.

## Authentication flow

1. Sign up with an email and password of at least 8 characters.
2. The web client logs in and stores the returned JWT in `localStorage`.
3. Todo requests include `Authorization: Bearer <token>`.
4. If the API returns `401`, the web client clears the stored token and returns to the login form.

## REST endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | No | Create a user account |
| `POST` | `/api/auth/login` | No | Return a 7-day JWT |
| `GET` | `/api/todos` | Yes | List the current user's todos |
| `POST` | `/api/todos` | Yes | Create a todo with `{ "title": "..." }` |
| `PATCH` | `/api/todos/:id` | Yes | Update owned todo `title` and/or `completed` |
| `DELETE` | `/api/todos/:id` | Yes | Delete an owned todo |

Todo titles are trimmed, required, and limited to 200 characters. Todo lookups and mutations are always scoped to the authenticated user's ID.

## Build and test

```sh
npm run build
npm test
```

Useful scoped commands:

```sh
npm --workspace @workspace/api test -- test/todos.spec.js
npm --workspace web test -- --runInBand src/App.test.jsx src/components/TodoApp.test.jsx
npm --workspace web run lint
```

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
