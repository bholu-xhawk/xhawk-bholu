import React, { useEffect, useState } from 'react';
import {
  createTodo,
  deleteTodo,
  listTodos,
  updateTodoCompleted,
} from '../api/todos.js';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadTodos() {
      try {
        setIsLoading(true);
        setError('');
        const loadedTodos = await listTodos();
        if (isMounted) setTodos(loadedTodos);
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load todos');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTodos();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAddTodo(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (isLoading || !trimmedTitle) return;

    try {
      setIsCreating(true);
      setError('');
      const created = await createTodo(trimmedTitle);
      setTodos((currentTodos) => [...currentTodos, created]);
      setTitle('');
    } catch (err) {
      setError(err.message || 'Unable to create todo');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleTodo(todo) {
    setPendingIds((currentIds) => new Set(currentIds).add(todo.id));

    try {
      setError('');
      const updated = await updateTodoCompleted(todo.id, !todo.completed);
      setTodos((currentTodos) =>
        currentTodos.map((currentTodo) =>
          currentTodo.id === updated.id ? updated : currentTodo
        )
      );
    } catch (err) {
      setError(err.message || 'Unable to update todo');
    } finally {
      setPendingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(todo.id);
        return nextIds;
      });
    }
  }

  async function handleDeleteTodo(todo) {
    setPendingIds((currentIds) => new Set(currentIds).add(todo.id));

    try {
      setError('');
      await deleteTodo(todo.id);
      setTodos((currentTodos) =>
        currentTodos.filter((currentTodo) => currentTodo.id !== todo.id)
      );
    } catch (err) {
      setError(err.message || 'Unable to delete todo');
    } finally {
      setPendingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(todo.id);
        return nextIds;
      });
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Todo app
        </p>
        <h1 className="text-3xl font-bold">Todos</h1>
        <p className="mt-2 text-gray-600">
          Keep track of your tasks and sync them with the API.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row"
        onSubmit={handleAddTodo}
      >
        <label className="sr-only" htmlFor="new-todo">
          New todo title
        </label>
        <input
          id="new-todo"
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a todo"
          disabled={isLoading || isCreating}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          type="submit"
          disabled={isLoading || isCreating || !title.trim()}
        >
          {isLoading ? 'Loading…' : isCreating ? 'Adding…' : 'Add todo'}
        </button>
      </form>

      {error ? (
        <div
          className="rounded border border-red-200 bg-red-50 p-3 text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {isLoading ? <p className="text-gray-600">Loading todos…</p> : null}

      {!isLoading && todos.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-gray-600 shadow">
          No todos yet. Add your first task above.
        </p>
      ) : null}

      <ul className="space-y-3" aria-label="Todo list">
        {todos.map((todo) => {
          const isPending = pendingIds.has(todo.id);

          return (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-lg bg-white p-4 shadow"
            >
              <input
                aria-label={`Mark ${todo.title} ${todo.completed ? 'incomplete' : 'complete'}`}
                className="h-5 w-5 rounded border-gray-300 text-blue-600"
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo)}
                disabled={isPending}
              />
              <span
                className={`flex-1 ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}
              >
                {todo.title}
              </span>
              <button
                className="rounded px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                type="button"
                onClick={() => handleDeleteTodo(todo)}
                disabled={isPending}
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
