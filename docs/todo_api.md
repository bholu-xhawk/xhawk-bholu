# Todo API

All routes are under the /api prefix.

## Todo object
- id: number
- title: string
- description: string
- completed: boolean
- createdAt: ISO string
- updatedAt: ISO string

## List todos
GET /api/todos

200 OK
[
  {
    "id": 1,
    "title": "Example",
    "description": "",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]

## Create todo
POST /api/todos

Body:
{
  "title": "string",
  "description": "string?"
}

Responses:
- 201 Created → Todo
- 422 Invalid input → { error: 'Invalid input', details }

## Get by id
GET /api/todos/:id

Responses:
- 200 OK → Todo
- 400 Invalid id → { error: 'Invalid id' }
- 404 Not found → { error: 'Todo not found' }

## Update
PUT /api/todos/:id

Body (partial allowed):
{
  "title": "string? (min 1)",
  "description": "string?",
  "completed": "boolean? (coerced)"
}

Responses:
- 200 OK → updated Todo
- 400 Invalid id → { error: 'Invalid id' }
- 404 Not found → { error: 'Todo not found' }
- 422 Invalid input → { error: 'Invalid input', details }

## Delete
DELETE /api/todos/:id

Responses:
- 204 No Content
- 400 Invalid id → { error: 'Invalid id' }
- 404 Not found → { error: 'Todo not found' }
