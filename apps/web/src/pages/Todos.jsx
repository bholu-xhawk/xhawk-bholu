import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { apiRequest } from '../lib/api.js';

export default function Todos({ token, onUnauthorized }) {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState('');

  const incompleteCount = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  useEffect(() => {
    let isMounted = true;

    async function loadTodos() {
      setIsLoading(true);
      setError('');
      try {
        const data = await apiRequest('/api/todos', { token, onUnauthorized });
        if (isMounted) setTodos(data);
      } catch (apiError) {
        if (isMounted && apiError.status !== 401) setError(apiError.message || 'Unable to load todos');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTodos();

    return () => {
      isMounted = false;
    };
  }, [token, onUnauthorized]);

  async function addTodo(event) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setError('Enter a todo title.');
      return;
    }

    setPendingAction('create');
    setError('');
    try {
      const todo = await apiRequest('/api/todos', {
        method: 'POST',
        body: { title },
        token,
        onUnauthorized,
      });
      setTodos((current) => [...current, todo]);
      setNewTitle('');
    } catch (apiError) {
      if (apiError.status !== 401) setError(apiError.message || 'Unable to create todo');
    } finally {
      setPendingAction('');
    }
  }

  async function updateTodo(id, patch) {
    setPendingAction(`todo-${id}`);
    setError('');
    try {
      const updated = await apiRequest(`/api/todos/${id}`, {
        method: 'PUT',
        body: patch,
        token,
        onUnauthorized,
      });
      setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)));
      setEditingId(null);
      setEditingTitle('');
    } catch (apiError) {
      if (apiError.status !== 401) setError(apiError.message || 'Unable to update todo');
    } finally {
      setPendingAction('');
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle('');
    setError('');
  }

  function saveEdit(todo) {
    const title = editingTitle.trim();
    if (!title) {
      setError('Enter a todo title.');
      return;
    }
    if (title === todo.title) {
      cancelEdit();
      return;
    }
    updateTodo(todo.id, { title });
  }

  async function completeAll() {
    setPendingAction('complete-all');
    setError('');
    try {
      const updatedTodos = await apiRequest('/api/todos/complete-all', {
        method: 'PUT',
        token,
        onUnauthorized,
      });
      setTodos(updatedTodos);
    } catch (apiError) {
      if (apiError.status !== 401) setError(apiError.message || 'Unable to complete todos');
    } finally {
      setPendingAction('');
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="mt-1 text-sm text-gray-600">
            {incompleteCount === 0 ? 'All caught up.' : `${incompleteCount} unfinished todo${incompleteCount === 1 ? '' : 's'}.`}
          </p>
        </div>
        <button
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-green-300"
          type="button"
          onClick={completeAll}
          disabled={pendingAction === 'complete-all' || incompleteCount === 0 || isLoading}
        >
          Mark all done
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={addTodo}>
        <label className="flex-1 text-sm font-medium text-gray-700">
          New todo
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="What needs to be done?"
          />
        </label>
        <button
          className="self-end rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
          type="submit"
          disabled={pendingAction === 'create'}
        >
          Add todo
        </button>
      </form>

      {isLoading ? <p className="mt-6 text-gray-600">Loading todos…</p> : null}

      {!isLoading && todos.length === 0 ? (
        <p className="mt-6 rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">No todos yet. Add one above.</p>
      ) : null}

      {!isLoading && todos.length > 0 ? (
        <ul className="mt-6 divide-y divide-gray-200">
          {todos.map((todo) => {
            const isPending = pendingAction === `todo-${todo.id}`;
            const isEditing = editingId === todo.id;
            return (
              <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center" key={todo.id}>
                <label className="flex flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => updateTodo(todo.id, { completed: !todo.completed })}
                    disabled={isPending}
                    aria-label={`Mark ${todo.title} ${todo.completed ? 'incomplete' : 'complete'}`}
                  />
                  {isEditing ? (
                    <input
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      aria-label={`Edit title for ${todo.title}`}
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                    />
                  ) : (
                    <span className={todo.completed ? 'text-gray-500 line-through' : ''}>{todo.title}</span>
                  )}
                </label>

                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-blue-300"
                      type="button"
                      onClick={() => saveEdit(todo)}
                      disabled={isPending}
                    >
                      Save title
                    </button>
                    <button className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700" type="button" onClick={cancelEdit}>
                      Cancel edit
                    </button>
                  </div>
                ) : (
                  <button className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700" type="button" onClick={() => startEdit(todo)}>
                    Edit {todo.title}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

Todos.propTypes = {
  token: PropTypes.string.isRequired,
  onUnauthorized: PropTypes.func.isRequired,
};
