import React, { useEffect, useState } from 'react';

export const TODO_STORAGE_KEY = 'home.todos';

function isStoredTodo(todo) {
  return (
    todo &&
    typeof todo === 'object' &&
    typeof todo.id === 'string' &&
    typeof todo.text === 'string' &&
    typeof todo.completed === 'boolean'
  );
}

export function loadTodosFromStorage() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedTodos = window.localStorage.getItem(TODO_STORAGE_KEY);

    if (!storedTodos) {
      return [];
    }

    const parsedTodos = JSON.parse(storedTodos);

    if (!Array.isArray(parsedTodos) || !parsedTodos.every(isStoredTodo)) {
      return [];
    }

    return parsedTodos;
  } catch {
    return [];
  }
}

function saveTodosToStorage(todos) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  } catch {
    return;
  }
}

function createTodoId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Home() {
  const [todos, setTodos] = useState(loadTodosFromStorage);
  const [newTodo, setNewTodo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    saveTodosToStorage(todos);
  }, [todos]);

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedTodo = newTodo.trim();

    if (!trimmedTodo) {
      setError('Enter a to-do before adding it.');
      return;
    }

    setTodos((currentTodos) => [
      ...currentTodos,
      {
        id: createTodoId(),
        text: trimmedTodo,
        completed: false,
      },
    ]);
    setNewTodo('');
    setError('');
  }

  function toggleTodo(todoId) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  function deleteTodo(todoId) {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== todoId));
  }

  return (
    <section className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Home</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Your to-do list</h1>
        <p className="mt-2 text-gray-600">
          Add tasks, mark them complete, and keep them saved in this browser.
        </p>
      </div>

      <form className="space-y-2" onSubmit={handleSubmit} noValidate>
        <label className="block text-sm font-medium text-gray-700" htmlFor="new-todo">
          New to-do
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            aria-describedby={error ? 'new-todo-error' : undefined}
            aria-invalid={Boolean(error)}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            id="new-todo"
            onChange={(event) => {
              setNewTodo(event.target.value);
              if (error) {
                setError('');
              }
            }}
            placeholder="Buy groceries"
            type="text"
            value={newTodo}
          />
          <button
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            type="submit"
          >
            Add
          </button>
        </div>
        {error ? (
          <p className="text-sm font-medium text-red-600" id="new-todo-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        {todos.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-4 text-center text-gray-500">
            No to-dos yet. Add one above to get started.
          </p>
        ) : (
          <ul className="mt-3 space-y-3" aria-label="To-do items">
            {todos.map((todo) => (
              <li
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 shadow-sm"
                key={todo.id}
              >
                <input
                  aria-label={`Mark ${todo.text} as ${todo.completed ? 'incomplete' : 'complete'}`}
                  checked={todo.completed}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  onChange={() => toggleTodo(todo.id)}
                  type="checkbox"
                />
                <span
                  className={`flex-1 ${
                    todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  aria-label={`Delete ${todo.text}`}
                  className="rounded-md px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                  onClick={() => deleteTodo(todo.id)}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
