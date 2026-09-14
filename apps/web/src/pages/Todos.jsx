import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'todos';

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (_error) {
    return null;
  }
}

function normalizeTodo(todo) {
  if (!todo || typeof todo !== 'object') {
    return null;
  }

  const id = typeof todo.id === 'string' && todo.id.trim() ? todo.id : null;
  const text = typeof todo.text === 'string' ? todo.text.trim() : '';

  if (!id || !text) {
    return null;
  }

  return {
    id,
    text,
    completed: Boolean(todo.completed),
    createdAt:
      typeof todo.createdAt === 'string'
        ? todo.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof todo.updatedAt === 'string'
        ? todo.updatedAt
        : new Date().toISOString(),
  };
}

function loadTodos() {
  const storage = getLocalStorage();

  if (!storage) {
    return [];
  }

  try {
    const storedTodos = storage.getItem(STORAGE_KEY);

    if (!storedTodos) {
      return [];
    }

    const parsedTodos = JSON.parse(storedTodos);

    if (!Array.isArray(parsedTodos)) {
      return [];
    }

    return parsedTodos.map(normalizeTodo).filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function saveTodos(todos) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (_error) {
    // Storage can be unavailable in private browsing or test environments.
  }
}

function createTodoId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Todos() {
  const [todos, setTodos] = useState(loadTodos);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const pendingTodos = useMemo(
    () => todos.filter((todo) => !todo.completed),
    [todos]
  );
  const completedTodos = useMemo(
    () => todos.filter((todo) => todo.completed),
    [todos]
  );

  function handleAddTodo(event) {
    event.preventDefault();

    const text = newTodoText.trim();

    if (!text) {
      return;
    }

    const now = new Date().toISOString();
    setTodos((currentTodos) => [
      ...currentTodos,
      {
        id: createTodoId(),
        text,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setNewTodoText('');
  }

  function handleToggleTodo(todoId) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId
          ? {
              ...todo,
              completed: !todo.completed,
              updatedAt: new Date().toISOString(),
            }
          : todo
      )
    );
  }

  function handleStartEdit(todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  function clearEditState() {
    setEditingId(null);
    setEditText('');
  }

  function handleSaveEdit(event, todoId) {
    event.preventDefault();

    const text = editText.trim();

    if (!text) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId
          ? { ...todo, text, updatedAt: new Date().toISOString() }
          : todo
      )
    );
    clearEditState();
  }

  function handleDeleteTodo(todoId) {
    setTodos((currentTodos) =>
      currentTodos.filter((todo) => todo.id !== todoId)
    );

    if (editingId === todoId) {
      clearEditState();
    }
  }

  function renderTodoSection(title, description, sectionTodos) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <span className="text-sm font-medium text-gray-500">
            {sectionTodos.length} total
          </span>
        </div>

        {sectionTodos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            No todos here yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {sectionTodos.map((todo) => {
              const isEditing = editingId === todo.id;

              return (
                <li
                  className={`rounded-xl border p-4 ${
                    todo.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-blue-100 bg-blue-50/60'
                  }`}
                  key={todo.id}
                >
                  {isEditing ? (
                    <form
                      className="space-y-3"
                      onSubmit={(event) => handleSaveEdit(event, todo.id)}
                    >
                      <label
                        className="block text-sm font-medium text-gray-700"
                        htmlFor={`edit-${todo.id}`}
                      >
                        Edit todo
                      </label>
                      <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        id={`edit-${todo.id}`}
                        onChange={(event) => setEditText(event.target.value)}
                        value={editText}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          type="submit"
                        >
                          Save changes
                        </button>
                        <button
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                          onClick={clearEditState}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <input
                          aria-label={
                            todo.completed
                              ? `Mark ${todo.text} pending`
                              : `Mark ${todo.text} complete`
                          }
                          checked={todo.completed}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onChange={() => handleToggleTodo(todo.id)}
                          type="checkbox"
                        />
                        <div>
                          <p
                            className={`text-lg font-medium ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
                          >
                            {todo.text}
                          </p>
                          <p
                            className={`mt-1 text-sm font-semibold ${todo.completed ? 'text-green-700' : 'text-blue-700'}`}
                          >
                            {todo.completed ? 'Completed' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
                          onClick={() => handleStartEdit(todo)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteTodo(todo.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Browser todos
        </p>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Todos</h1>
        <p className="max-w-2xl text-gray-600">
          Add tasks, keep track of what is pending, and preserve your list in
          this browser.
        </p>
      </header>

      <form
        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6"
        onSubmit={handleAddTodo}
      >
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="new-todo"
        >
          New todo
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            id="new-todo"
            onChange={(event) => setNewTodoText(event.target.value)}
            placeholder="Write a task to remember"
            value={newTodoText}
          />
          <button
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
            type="submit"
          >
            Add todo
          </button>
        </div>
      </form>

      <div aria-live="polite" className="grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">
          Pending: {pendingTodos.length}
        </p>
        <p className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800">
          Completed: {completedTodos.length}
        </p>
      </div>

      {todos.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">No todos yet</h2>
          <p className="mt-2 text-gray-600">
            Add your first todo to start planning your day.
          </p>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {renderTodoSection(
            'Pending',
            'Tasks that still need attention.',
            pendingTodos
          )}
          {renderTodoSection(
            'Completed',
            'Finished tasks kept for reference.',
            completedTodos
          )}
        </div>
      )}
    </div>
  );
}
