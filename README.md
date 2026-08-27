# xhawk-bholu

A small full-stack workspace with an Express/Prisma API and a React/Vite web app.

## Local setup

Install dependencies for each app:

```sh
npm install --prefix apps/api
npm install --prefix apps/web
```

Create the API environment file and set the local database and port:

```sh
cp apps/api/.env.example apps/api/.env
```

`apps/api/.env` should include values like:

```env
JWT_SECRET=dev-secret
DATABASE_URL="file:./dev.db"
PORT=3001
```

Prepare the SQLite database before starting the API:

```sh
npm --prefix apps/api run prisma:generate
npm --prefix apps/api run prisma:push
```

Start the API and web app in separate terminals:

```sh
npm --prefix apps/api run dev
npm --prefix apps/web run dev
```

The web Todo UI calls `http://localhost:3001/api` by default. Tests or local pages can override this with `window.__API_BASE_URL__`; authenticated calls send a bearer token from `window.__AUTH_TOKEN__` or `localStorage.authToken` when present.

## Todo API

The authenticated Todo resource is available at `/api/todos`. Include `Authorization: Bearer <token>` from `/api/auth/login`; each user can only access their own todos.

- `GET /api/todos` lists the authenticated user's todos.
- `POST /api/todos` creates a todo for the authenticated user with `{ "title": "Task" }`.
- `PATCH /api/todos/:id` updates one of the authenticated user's todos with `{ "completed": true }`.
- `DELETE /api/todos/:id` deletes one of the authenticated user's todos.

CORS is enabled for the Vite dev server origin, `http://localhost:5173`, by default.

## Tests and builds

```sh
npm --prefix apps/api test
npm --prefix apps/web test
npm --prefix apps/api run build
npm --prefix apps/web run build
```

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)
