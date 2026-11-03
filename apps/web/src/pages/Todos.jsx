import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { completeAllTodos, createTodo, listTodos, updateTodo } from '../api.js';

const noop = () => {};

export default function Todos({ onUnauthorized = noop }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
  const [completingIds, setCompletingIds] = useState(() => new Set());
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [savingEditId, setSavingEditId] = useState(null);
  const committingEditId = useRef(null);
  const navigate = useNavigate();

  const handleUnauthorized = useCallback((err) => {
    if (err.status === 401) {
      onUnauthorized();
      navigate('/auth', { replace: true });
      return true;
    }
    return false;
  }, [navigate, onUnauthorized]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await listTodos();
        if (!cancelled) setTodos(data);
      } catch (err) {
        if (!cancelled && !handleUnauthorized(err)) setLoadError(err.message || 'Could not load todos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [handleUnauthorized]);

  async function handleCreate(event) {
    event.preventDefault();
    if (creating) return;

    const title = newTitle.trim();
    if (!title) {
      setActionError('Todo title cannot be blank');
      return;
    }

    setCreating(true);
    setActionError('');
    try {
      const todo = await createTodo(title);
      setTodos((current) => [...current, todo]);
      setNewTitle('');
    } catch (err) {
      if (!handleUnauthorized(err)) setActionError(err.message || 'Could not add todo');
    } finally {
      setCreating(false);
    }
  }

  async function handleComplete(todo) {
    if (todo.completed || completingIds.has(todo.id)) return;

    setActionError('');
    setCompletingIds((current) => new Set(current).add(todo.id));
    try {
      const updated = await updateTodo(todo.id, { completed: true });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      if (!handleUnauthorized(err)) setActionError(err.message || 'Could not complete todo');
    } finally {
      setCompletingIds((current) => {
        const next = new Set(current);
        next.delete(todo.id);
        return next;
      });
    }
  }

  async function handleCompleteAll() {
    if (completingAll || todos.every((todo) => todo.completed)) return;

    setCompletingAll(true);
    setActionError('');
    try {
      const updatedTodos = await completeAllTodos();
      setTodos(updatedTodos);
    } catch (err) {
      if (!handleUnauthorized(err)) setActionError(err.message || 'Could not complete all todos');
    } finally {
      setCompletingAll(false);
    }
  }

  function beginEdit(todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setActionError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    committingEditId.current = null;
  }

  async function commitEdit(todo) {
    if (committingEditId.current === todo.id) return;

    const title = editTitle.trim();
    if (!title) {
      setActionError('Todo title cannot be blank');
      return;
    }
    if (title === todo.title) {
      cancelEdit();
      return;
    }

    committingEditId.current = todo.id;
    setSavingEditId(todo.id);
    setActionError('');
    try {
      const updated = await updateTodo(todo.id, { title });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      cancelEdit();
    } catch (err) {
      if (!handleUnauthorized(err)) setActionError(err.message || 'Could not update todo');
    } finally {
      committingEditId.current = null;
      setSavingEditId(null);
    }
  }

  if (loading) {
    return <p role="status">Loading todos…</p>;
  }

  return (
    <section className="mx-auto max-w-2xl rounded bg-white p-6 shadow">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Todos</h1>
        <button
          className="rounded bg-green-600 px-3 py-2 font-semibold text-white disabled:opacity-60"
          type="button"
          onClick={handleCompleteAll}
          disabled={completingAll || todos.length === 0 || todos.every((todo) => todo.completed)}
        >
          {completingAll ? 'Completing…' : 'Complete all'}
        </button>
      </div>

      {loadError ? <p role="alert" className="mb-4 text-red-700">{loadError}</p> : null}
      {actionError ? <p role="alert" className="mb-4 text-red-700">{actionError}</p> : null}

      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <label className="sr-only" htmlFor="new-todo">New todo</label>
        <input
          id="new-todo"
          className="flex-1 rounded border border-gray-300 p-2"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a todo"
          disabled={creating}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={creating}
        >
          {creating ? 'Adding…' : 'Add'}
        </button>
      </form>

      {todos.length === 0 ? <p>No todos yet. Add your first todo.</p> : null}

      <ul className="space-y-3">
        {todos.map((todo) => {
          const isEditing = editingId === todo.id;
          const isCompleting = completingIds.has(todo.id);
          const isSaving = savingEditId === todo.id;
          return (
            <li key={todo.id} className="flex items-center gap-3 rounded border border-gray-200 p-3">
              <input
                aria-label={`Complete ${todo.title}`}
                type="checkbox"
                checked={todo.completed}
                disabled={todo.completed || isCompleting}
                onChange={() => handleComplete(todo)}
              />
              {isEditing ? (
                <input
                  aria-label={`Edit ${todo.title}`}
                  className="flex-1 rounded border border-gray-300 p-2"
                  value={editTitle}
                  disabled={isSaving}
                  autoFocus
                  onChange={(event) => setEditTitle(event.target.value)}
                  onBlur={() => commitEdit(todo)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      commitEdit(todo);
                    }
                    if (event.key === 'Escape') cancelEdit();
                  }}
                />
              ) : (
                <span className={`flex-1 ${todo.completed ? 'text-gray-500 line-through' : ''}`}>{todo.title}</span>
              )}
              <button
                className="text-blue-600 hover:underline disabled:text-gray-500"
                type="button"
                onClick={() => beginEdit(todo)}
                disabled={isEditing || isSaving}
              >
                Edit
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

Todos.propTypes = {
  onUnauthorized: PropTypes.func,
};
