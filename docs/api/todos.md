# Mock TODO REST API

The TODO API is an in-memory mock under `/api/todos`. It does not require auth and does not persist across process restarts. Each TODO response has this shape:

```json
{
  "id": 1,
  "title": "Write mock API",
  "completed": false,
  "description": "Document examples",
  "createdAt": "2026-09-11T00:00:00.000Z",
  "updatedAt": "2026-09-11T00:00:00.000Z"
}
```

`description` is `null` when omitted. Invalid request bodies return `422` with `{ "error": "Invalid input", "details": ... }`. Invalid ids return `400` with `{ "error": "Invalid id" }`. Valid ids that do not exist return `404` with `{ "error": "Todo not found" }`.

## List TODOs

`GET /api/todos`

Status: `200`

```json
[
  {
    "id": 1,
    "title": "Write mock API",
    "completed": false,
    "description": "Document examples",
    "createdAt": "2026-09-11T00:00:00.000Z",
    "updatedAt": "2026-09-11T00:00:00.000Z"
  }
]
```

## Read a TODO

`GET /api/todos/1`

Status: `200`

```json
{
  "id": 1,
  "title": "Write mock API",
  "completed": false,
  "description": "Document examples",
  "createdAt": "2026-09-11T00:00:00.000Z",
  "updatedAt": "2026-09-11T00:00:00.000Z"
}
```

## Create a TODO

`POST /api/todos`

Request body:

```json
{
  "title": "Write mock API",
  "description": "Document examples",
  "completed": false
}
```

Only `title` is required. `title` must be a non-empty string, `description` must be a string when present, and `completed` must be a boolean when present.

Status: `201`

```json
{
  "id": 1,
  "title": "Write mock API",
  "completed": false,
  "description": "Document examples",
  "createdAt": "2026-09-11T00:00:00.000Z",
  "updatedAt": "2026-09-11T00:00:00.000Z"
}
```

## Update a TODO

`PUT /api/todos/1`

Request body:

```json
{
  "title": "Ship mock API",
  "completed": true,
  "description": "Docs are complete"
}
```

At least one of `title`, `description`, or `completed` is required. Fields not included are left unchanged.

Status: `200`

```json
{
  "id": 1,
  "title": "Ship mock API",
  "completed": true,
  "description": "Docs are complete",
  "createdAt": "2026-09-11T00:00:00.000Z",
  "updatedAt": "2026-09-11T00:05:00.000Z"
}
```

## Delete a TODO

`DELETE /api/todos/1`

Status: `204` with an empty response body. A later `GET /api/todos/1` returns `404`.
