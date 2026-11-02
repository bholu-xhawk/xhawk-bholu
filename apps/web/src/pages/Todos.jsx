import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api.js';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');

  const incompleteCount = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    apiRequest('/todos')
      .then((items) => {
        if (active) setTodos(items || []);
      })
      .catch((apiError) => {
        if (active) setError(apiError.message || 'Failed to load todos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const title = newTitle.trim();
    setError('');

    if (!title) {
      setError('A title is required.');
      return;
    }

    setPendingAction('add');
    try {
      const todo = await apiRequest('/todos', { method: 'POST', body: { title } });
      setTodos((current) => [...current, todo]);
      setNewTitle('');
    } catch (apiError) {
      setError(apiError.message || 'Failed to add todo.');
    } finally {
      setPendingAction('');
    }
  }

  async function toggleTodo(todo) {
    setError('');
    setPendingAction(`toggle-${todo.id}`);
    try {
      const updated = await apiRequest(`/todos/${todo.id}`, {
        method: 'PATCH',
        body: { completed: !todo.completed },
      });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (apiError) {
      setError(apiError.message || 'Failed to update todo.');
    } finally {
      setPendingAction('');
    }
  }

  function startEditing(todo) {
    setError('');
    setEditingId(todo.id);
    setDraftTitle(todo.title);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftTitle('');
  }

  async function saveEdit(todo) {
    const title = draftTitle.trim();
    setError('');

    if (!title) {
      setError('A title is required.');
      setDraftTitle(todo.title);
      setEditingId(null);
      return;
    }

    setPendingAction(`edit-${todo.id}`);
    try {
      const updated = await apiRequest(`/todos/${todo.id}`, { method: 'PATCH', body: { title } });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      cancelEditing();
    } catch (apiError) {
      setError(apiError.message || 'Failed to update todo.');
      setDraftTitle(todo.title);
      setEditingId(null);
    } finally {
      setPendingAction('');
    }
  }

  function handleEditKeyDown(event, todo) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEdit(todo);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  async function markAllDone() {
    setError('');
    setPendingAction('bulk');
    try {
      const updatedTodos = await apiRequest('/todos/complete-all', { method: 'PATCH' });
      setTodos(updatedTodos || []);
    } catch (apiError) {
      setError(apiError.message || 'Failed to mark all todos done.');
    } finally {
      setPendingAction('');
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded bg-white p-6 shadow">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="text-sm text-gray-600">{incompleteCount} incomplete</p>
        </div>
        <button
          type="button"
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          onClick={markAllDone}
          disabled={loading || pendingAction === 'bulk' || incompleteCount === 0}
        >
          {pendingAction === 'bulk' ? 'Marking…' : 'Mark all done'}
        </button>
      </div>

      <form className="mb-6 flex gap-2" onSubmit={handleAdd}>
        <label className="sr-only" htmlFor="new-todo">New todo</label>
        <input
          id="new-todo"
          aria-label="New todo"
          className="min-w-0 flex-1 rounded border px-3 py-2"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          disabled={pendingAction === 'add'}
          placeholder="What needs doing?"
        />
        <button className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={pendingAction === 'add'}>
          {pendingAction === 'add' ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error ? <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p> : null}
      {loading ? <p>Loading todos…</p> : null}
      {!loading && todos.length === 0 ? <p>No todos yet. Add your first todo above.</p> : null}

      {!loading && todos.length > 0 ? (
        <ul className="space-y-3" aria-label="Todo list">
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            const rowPending = pendingAction === `toggle-${todo.id}` || pendingAction === `edit-${todo.id}`;

            return (
              <li key={todo.id} className="rounded border p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                    disabled={rowPending}
                    aria-label={todo.completed ? `Mark ${todo.title} incomplete` : `Mark ${todo.title} done`}
                  />
                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`edit-${todo.id}`}>Edit todo</label>
                      <input
                        id={`edit-${todo.id}`}
                        aria-label="Edit todo"
                        className="min-w-0 flex-1 rounded border px-3 py-2"
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onKeyDown={(event) => handleEditKeyDown(event, todo)}
                        disabled={rowPending}
                        autoFocus
                      />
                      <button type="button" className="rounded border px-3 py-2" onClick={() => saveEdit(todo)} disabled={rowPending}>
                        Save
                      </button>
                      <button type="button" className="rounded border px-3 py-2" onClick={cancelEditing} disabled={rowPending}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={todo.completed ? 'flex-1 text-gray-500 line-through' : 'flex-1'}>{todo.title}</span>
                      {todo.completed ? <span className="text-sm text-green-700">Complete</span> : null}
                      <button type="button" className="rounded border px-3 py-2" onClick={() => startEditing(todo)} disabled={rowPending} aria-label={`Edit ${todo.title}`}>
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
