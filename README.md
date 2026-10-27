# xhawk-bholu

## Mock TODO API

The API exposes a mock TODO deletion endpoint for clients that need to exercise delete behavior without database persistence, JWT setup, or broader TODO CRUD support.

### `DELETE /api/todos/:id`

- `:id` must be a positive integer.
- TODOs are stored in seeded, process-local memory.
- Deleting a TODO mutates that in-memory state for the lifetime of the Node process.
- Restarting the API process restores the seeded TODOs.

Successful deletion returns HTTP 200:

```json
{
  "message": "TODO deleted successfully",
  "todo": {
    "id": 1,
    "title": "Review mock TODO API",
    "completed": false
  }
}
```

If the ID is valid but no seeded TODO exists, the endpoint returns HTTP 404:

```json
{ "error": "TODO not found" }
```

If the ID is malformed or non-positive, the endpoint returns HTTP 400:

```json
{ "error": "Invalid id" }
```

Run the API and delete a seeded TODO:

```sh
cd apps/api
npm start
curl -i -X DELETE http://localhost:3001/api/todos/1
```

Repeating the same request in the same API process returns `404` because the mock TODO has already been removed.

## Test Plan

- New Planning State Machine Test Plan: [docs/test_plan_planning_state_machine.md](docs/test_plan_planning_state_machine.md)

## Documentation

- Internal Agent/System Flows index: [docs/README.md](docs/README.md)
