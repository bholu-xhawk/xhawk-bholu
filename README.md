# xhawk-bholu

## Book table web app

The React app in `apps/web` displays books from the companion Node/Mongo API.

### Local run order

1. Start MongoDB for the backend API.
2. Start the backend from the companion `xhawk-bholu-two/node_api` repo.
3. Start this frontend:

```sh
cd apps/web
npm install
npm run dev
```

By default the app calls `http://localhost:3000/books`. If the backend runs elsewhere, create `apps/web/.env` and set:

```sh
VITE_BOOKS_API_URL=http://localhost:3000
```

The UI expects the API to expose `GET /books` and `PATCH /books/:id/starred` with book objects shaped as `{ id, name, details, authors, starred, createdAt, updatedAt }`.

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
