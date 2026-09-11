import {
  makeCreateTodoResponse,
  makeDeleteTodoResponse,
  makeReadTodoResponse,
  makeReadTodosResponse,
  makeTodo,
  makeTodoList,
  makeTodoNotFoundResponse,
  makeUpdateTodoResponse,
} from '../mocks/todo.js';

describe('To-do mock utilities', () => {
  it('creates a default to-do with expected stable shape and defaults', () => {
    const todo = makeTodo();

    expect(todo).toEqual({
      id: 1,
      title: 'Sample to-do title',
      description: 'This is a mock to-do used for testing and examples.',
      completed: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      completedAt: null,
    });
  });

  it('applies to-do overrides after defaults', () => {
    const todo = makeTodo({
      id: 'todo-42',
      title: 'Write mock tests',
      description: 'Pin the response contract',
      completed: true,
      createdAt: '2024-03-01T10:00:00.000Z',
      updatedAt: '2024-03-02T10:00:00.000Z',
      completedAt: '2024-03-03T10:00:00.000Z',
    });

    expect(todo).toEqual({
      id: 'todo-42',
      title: 'Write mock tests',
      description: 'Pin the response contract',
      completed: true,
      createdAt: '2024-03-01T10:00:00.000Z',
      updatedAt: '2024-03-02T10:00:00.000Z',
      completedAt: '2024-03-03T10:00:00.000Z',
    });
  });

  it('generates a repeatable list with per-index overrides', () => {
    const todos = makeTodoList(4, (idx) => ({
      completed: idx % 2 === 0,
      title: `Todo ${idx + 1}`,
    }));

    expect(todos).toHaveLength(4);
    expect(todos.map((todo) => todo.id)).toEqual([1, 2, 3, 4]);
    expect(todos.map((todo) => todo.title)).toEqual([
      'Todo 1',
      'Todo 2',
      'Todo 3',
      'Todo 4',
    ]);
    expect(todos.map((todo) => todo.completed)).toEqual([
      true,
      false,
      true,
      false,
    ]);
    expect(todos[0].completedAt).toBe('2024-01-02T00:00:00.000Z');
    expect(todos[1].completedAt).toBeNull();
  });

  it('wraps created to-dos in a 201 API-shaped response', () => {
    const response = makeCreateTodoResponse({
      id: 'created-1',
      title: 'Created to-do',
    });

    expect(response).toEqual({
      status: 201,
      data: expect.objectContaining({
        id: 'created-1',
        title: 'Created to-do',
        completed: false,
      }),
    });
  });

  it('wraps read list results with status and total metadata', () => {
    const response = makeReadTodosResponse(2, (idx) => ({
      title: `Read to-do ${idx + 1}`,
    }));

    expect(response).toEqual({
      status: 200,
      data: [
        expect.objectContaining({ id: 1, title: 'Read to-do 1' }),
        expect.objectContaining({ id: 2, title: 'Read to-do 2' }),
      ],
      meta: {
        total: 2,
      },
    });
  });

  it('wraps a single read to-do in a 200 response', () => {
    const response = makeReadTodoResponse({ id: 'read-1', completed: true });

    expect(response).toEqual({
      status: 200,
      data: expect.objectContaining({
        id: 'read-1',
        completed: true,
        completedAt: '2024-01-02T00:00:00.000Z',
      }),
    });
  });

  it('wraps updated to-dos in a 200 response', () => {
    const response = makeUpdateTodoResponse({
      id: 'updated-1',
      title: 'Updated title',
      completed: true,
    });

    expect(response).toEqual({
      status: 200,
      data: expect.objectContaining({
        id: 'updated-1',
        title: 'Updated title',
        completed: true,
      }),
    });
  });

  it('wraps delete success with deleted id and message', () => {
    expect(makeDeleteTodoResponse('deleted-1')).toEqual({
      status: 200,
      success: true,
      deletedId: 'deleted-1',
      message: 'Todo deleted',
    });
  });

  it('returns a consistent not-found response for missing to-dos', () => {
    expect(makeTodoNotFoundResponse('missing-1')).toEqual({
      status: 404,
      error: {
        code: 'TODO_NOT_FOUND',
        message: 'Todo not found',
        id: 'missing-1',
      },
    });
  });
});
