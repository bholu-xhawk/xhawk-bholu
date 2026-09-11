// To-do mock utilities for frontend tests and examples (ESM)

const DEFAULT_CREATED_AT = '2024-01-01T00:00:00.000Z';
const DEFAULT_UPDATED_AT = '2024-01-01T00:00:00.000Z';
const DEFAULT_COMPLETED_AT = '2024-01-02T00:00:00.000Z';

export function makeTodo(overrides = {}) {
  const id = overrides.id ?? 1;
  const completed = overrides.completed ?? false;

  const computed = {
    id,
    title: 'Sample to-do title',
    description: 'This is a mock to-do used for testing and examples.',
    completed,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_UPDATED_AT,
    completedAt: completed ? DEFAULT_COMPLETED_AT : null,
  };

  // Apply overrides last to allow explicit overriding of any field.
  return { ...computed, ...overrides };
}

export function makeTodoList(count = 3, overridesFn) {
  const todos = [];

  for (let i = 0; i < count; i++) {
    const base = {
      id: i + 1,
      title: `Sample to-do ${i + 1}`,
    };
    const overrides =
      typeof overridesFn === 'function' ? overridesFn(i) : undefined;
    todos.push(makeTodo({ ...base, ...(overrides || {}) }));
  }

  return todos;
}

export function makeCreateTodoResponse(overrides = {}) {
  return {
    status: 201,
    data: makeTodo(overrides),
  };
}

export function makeReadTodosResponse(count = 3, overridesFn) {
  const todos = makeTodoList(count, overridesFn);

  return {
    status: 200,
    data: todos,
    meta: {
      total: todos.length,
    },
  };
}

export function makeReadTodoResponse(overrides = {}) {
  return {
    status: 200,
    data: makeTodo(overrides),
  };
}

export function makeUpdateTodoResponse(overrides = {}) {
  return {
    status: 200,
    data: makeTodo(overrides),
  };
}

export function makeDeleteTodoResponse(id = 1) {
  return {
    status: 200,
    success: true,
    deletedId: id,
    message: 'Todo deleted',
  };
}

export function makeTodoNotFoundResponse(id) {
  return {
    status: 404,
    error: {
      code: 'TODO_NOT_FOUND',
      message: 'Todo not found',
      id,
    },
  };
}
