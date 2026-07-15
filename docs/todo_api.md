# Todo API

The Todo API is served by the existing Express API service under the base path `/api/todos`.

## Todo shape

```json
{
  "id": 1,
  "title": "Write API docs",
  "description": "Document the Todo endpoints",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

Allowed `status` values are:

- `pending`
- `completed`

`description` defaults to an empty string, and `status` defaults to `pending`.

## List todos

`GET /api/todos`

Returns all todos ordered by ascending `id`.

### Response `200`

```json
[
  {
    "id": 1,
    "title": "Write API docs",
    "description": "Document the Todo endpoints",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Read a todo

`GET /api/todos/:id`

### Response `200`

```json
{
  "id": 1,
  "title": "Write API docs",
  "description": "Document the Todo endpoints",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Response `400`

Returned when `:id` is not a positive integer.

```json
{ "error": "Invalid id" }
```

### Response `404`

```json
{ "error": "Todo not found" }
```

## Create a todo

`POST /api/todos`

### Request body

```json
{
  "title": "Write API docs",
  "description": "Document the Todo endpoints",
  "status": "pending"
}
```

`title` is required and must not be empty. `description` and `status` are optional.

### Response `201`

```json
{
  "id": 1,
  "title": "Write API docs",
  "description": "Document the Todo endpoints",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Response `422`

Returned when the request body is invalid, such as an empty `title` or unsupported `status`.

```json
{
  "error": "Invalid input",
  "details": {
    "formErrors": [],
    "fieldErrors": {
      "title": ["String must contain at least 1 character(s)"]
    }
  }
}
```

## Update a todo

`PUT /api/todos/:id`

Updates any provided subset of `title`, `description`, and `status`. At least one valid field is required; `{}` is rejected with `422`.

### Request body

```json
{
  "status": "completed"
}
```

### Response `200`

```json
{
  "id": 1,
  "title": "Write API docs",
  "description": "Document the Todo endpoints",
  "status": "completed",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:05:00.000Z"
}
```

### Response `400`

Returned when `:id` is not a positive integer.

```json
{ "error": "Invalid id" }
```

### Response `404`

```json
{ "error": "Todo not found" }
```

### Response `422`

Returned when the request body is invalid.

```json
{
  "error": "Invalid input",
  "details": {
    "formErrors": ["At least one field is required"],
    "fieldErrors": {}
  }
}
```

## Delete a todo

`DELETE /api/todos/:id`

### Response `204`

The response body is empty.

### Response `400`

Returned when `:id` is not a positive integer.

```json
{ "error": "Invalid id" }
```

### Response `404`

```json
{ "error": "Todo not found" }
```

## Server errors

Unexpected storage failures return `500` with an operation-specific message.

```json
{ "error": "Failed to create todo" }
```
