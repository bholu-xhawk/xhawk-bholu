import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api.js';

export default function TodoApp({ token, onLogout, onUnauthorized = undefined }) {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleApiError = useCallback(
    (err) => {
      if (err.unauthorized) {
        onUnauthorized?.('Your session expired. Please log in again.');
        return;
      }
      setError(err.message || 'Something went wrong');
    },
    [onUnauthorized]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listTodos(token)
      .then((items) => {
        if (active) setTodos(items);
      })
      .catch((err) => {
        if (active) handleApiError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [handleApiError, token]);

  async function handleAdd(event) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setError('Todo title is required.');
      return;
    }

    setAdding(true);
    setError('');
    try {
      const todo = await createTodo(token, title);
      setTodos((current) => [...current, todo]);
      setNewTitle('');
    } catch (err) {
      handleApiError(err);
    } finally {
      setAdding(false);
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setError('');
  }

  async function saveEdit(todo) {
    const title = editingTitle.trim();
    if (!title) {
      setError('Todo title is required.');
      return;
    }

    setPendingId(todo.id);
    setError('');
    try {
      const updated = await updateTodo(token, todo.id, { title });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      handleApiError(err);
    } finally {
      setPendingId(null);
    }
  }

  async function toggleTodo(todo) {
    setPendingId(todo.id);
    setError('');
    try {
      const updated = await updateTodo(token, todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      handleApiError(err);
    } finally {
      setPendingId(null);
    }
  }

  async function removeTodo(todo) {
    setPendingId(todo.id);
    setError('');
    try {
      await deleteTodo(token, todo.id);
      setTodos((current) => current.filter((item) => item.id !== todo.id));
    } catch (err) {
      handleApiError(err);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="todo-heading">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 id="todo-heading" className="text-3xl font-bold text-gray-950">My todos</h1>
          <p className="text-sm text-gray-600">Add, complete, edit, and delete your private tasks.</p>
        </div>
        <button className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50" type="button" onClick={onLogout}>
          Log out
        </button>
      </div>

      <form className="mt-6 flex flex-col gap-3 rounded-xl bg-white p-4 shadow sm:flex-row" onSubmit={handleAdd}>
        <label className="sr-only" htmlFor="new-todo">New todo title</label>
        <input
          id="new-todo"
          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Add a todo"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          maxLength={200}
          disabled={adding}
        />
        <button className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={adding}>
          {adding ? 'Adding…' : 'Add todo'}
        </button>
      </form>

      {error ? <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p role="status" className="mt-6 text-gray-600">Loading todos…</p> : null}
      {!loading && todos.length === 0 ? <p className="mt-6 rounded bg-white p-6 text-center text-gray-600 shadow">No todos yet. Add your first task above.</p> : null}

      {!loading && todos.length > 0 ? (
        <ul className="mt-6 space-y-3" aria-label="Todo list">
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            const isPending = pendingId === todo.id;

            return (
              <li key={todo.id} className="rounded-xl bg-white p-4 shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo)}
                      disabled={isPending || isEditing}
                      aria-label={`Mark ${todo.title} ${todo.completed ? 'incomplete' : 'complete'}`}
                    />
                    {isEditing ? (
                      <input
                        className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label="Edit todo title"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        maxLength={200}
                        disabled={isPending}
                      />
                    ) : (
                      <span className={todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>{todo.title}</span>
                    )}
                  </label>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button className="rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60" type="button" onClick={() => saveEdit(todo)} disabled={isPending}>
                          Save
                        </button>
                        <button className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50" type="button" onClick={() => setEditingId(null)} disabled={isPending}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50" type="button" onClick={() => startEdit(todo)} disabled={isPending}>
                        Edit
                      </button>
                    )}
                    <button className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" type="button" onClick={() => removeTodo(todo)} disabled={isPending || isEditing}>
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

TodoApp.propTypes = {
  token: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
  onUnauthorized: PropTypes.func,
};

