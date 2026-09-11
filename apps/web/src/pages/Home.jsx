import React, { useEffect, useState } from 'react';

const TODOS_STORAGE_KEY = 'web.todos';
const RESTORE_ERROR_MESSAGE =
  'We could not restore your saved tasks, so we started a fresh list.';
const SAVE_ERROR_MESSAGE =
  'We could not save your latest changes. Please keep this tab open and try again.';

function normalizeTodos(value) {
  if (!Array.isArray(value)) {
    throw new Error('Saved todos must be an array.');
  }

  return value.map((todo) => {
    if (!todo || typeof todo !== 'object' || typeof todo.text !== 'string') {
      throw new Error('Saved todos have an unsupported shape.');
    }

    return {
      id: typeof todo.id === 'string' && todo.id ? todo.id : createTodoId(),
      text: todo.text,
      completed: Boolean(todo.completed),
      createdAt:
        typeof todo.createdAt === 'string' && todo.createdAt
          ? todo.createdAt
          : new Date().toISOString(),
    };
  });
}

export function loadTodosFromStorage(storage = window.localStorage) {
  try {
    const savedTodos = storage.getItem(TODOS_STORAGE_KEY);

    if (!savedTodos) {
      return { todos: [], error: '' };
    }

    return { todos: normalizeTodos(JSON.parse(savedTodos)), error: '' };
  } catch (error) {
    return {
      todos: [],
      error: RESTORE_ERROR_MESSAGE,
    };
  }
}

export function saveTodosToStorage(todos, storage = window.localStorage) {
  storage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
}

function createTodoId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createTodo(text) {
  return {
    id: createTodoId(),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export default function Home() {
  const [loadedTodos] = useState(() => loadTodosFromStorage());
  const [todos, setTodos] = useState(loadedTodos.todos);
  const [taskText, setTaskText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [storageError, setStorageError] = useState(loadedTodos.error);

  useEffect(() => {
    try {
      saveTodosToStorage(todos);

      if (storageError === SAVE_ERROR_MESSAGE) {
        setStorageError('');
      }
    } catch (error) {
      setStorageError(SAVE_ERROR_MESSAGE);
    }
  }, [todos, storageError]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedText = taskText.trim();

    if (!trimmedText) {
      setValidationError('Enter a task before adding it to your list.');
      return;
    }

    setTodos((currentTodos) => [createTodo(trimmedText), ...currentTodos]);
    setTaskText('');
    setValidationError('');
  }

  function toggleTodo(todoId) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  function deleteTodo(todoId) {
    setTodos((currentTodos) =>
      currentTodos.filter((todo) => todo.id !== todoId)
    );
  }

  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-lg sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Browser-local task list
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
          To-do app
        </h1>
        <p className="mt-3 text-gray-600">
          Add tasks, mark them complete, and keep them saved in this browser.
        </p>
      </div>

      {storageError ? (
        <div
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="alert"
        >
          {storageError}
        </div>
      ) : null}

      <form className="rounded-2xl bg-gray-50 p-4" onSubmit={handleSubmit}>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="task-text"
        >
          New task
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            aria-describedby={
              validationError ? 'task-validation-error' : undefined
            }
            aria-invalid={validationError ? 'true' : 'false'}
            className="min-h-12 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            id="task-text"
            onChange={(event) => {
              setTaskText(event.target.value);
              if (validationError) {
                setValidationError('');
              }
            }}
            placeholder="e.g. Schedule project review"
            type="text"
            value={taskText}
          />
          <button
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            type="submit"
          >
            Add task
          </button>
        </div>
        {validationError ? (
          <p
            className="mt-2 text-sm text-red-600"
            id="task-validation-error"
            role="alert"
          >
            {validationError}
          </p>
        ) : null}
      </form>

      <div className="mt-8 flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">Tasks</h2>
          <p className="text-sm text-gray-500" aria-live="polite">
            {todos.length} total, {completedCount} completed
          </p>
        </div>
      </div>

      {todos.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-lg font-medium text-gray-800">No tasks yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Add your first task above to start tracking your work.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" aria-label="Task list">
          {todos.map((todo) => (
            <li
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              key={todo.id}
            >
              <input
                aria-label={`Toggle ${todo.text}`}
                checked={todo.completed}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onChange={() => toggleTodo(todo.id)}
                type="checkbox"
              />
              <span
                className={`flex-1 text-base ${
                  todo.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-900'
                }`}
              >
                {todo.text}
              </span>
              <span className="sr-only">
                {todo.completed ? 'Completed' : 'Active'} task
              </span>
              <button
                aria-label={`Delete ${todo.text}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
                onClick={() => deleteTodo(todo.id)}
                type="button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
