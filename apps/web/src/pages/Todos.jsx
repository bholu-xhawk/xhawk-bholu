import React, { useEffect, useMemo, useState } from 'react';
import { completeAllTodos, createTodo, listTodos, updateTodo } from '../api.js';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
  const [busyTodoId, setBusyTodoId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editError, setEditError] = useState('');

  const pendingCount = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  async function loadTodos() {
    setLoading(true);
    setError('');
    try {
      setTodos(await listTodos());
    } catch (err) {
      setError(err.message || 'Could not load todos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setError('Todo title is required.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const todo = await createTodo(title);
      setTodos((current) => [todo, ...current]);
      setNewTitle('');
    } catch (err) {
      setError(err.message || 'Could not create todo.');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(todo) {
    setBusyTodoId(todo.id);
    setError('');
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Could not update todo.');
    } finally {
      setBusyTodoId(null);
    }
  }

  function beginEdit(todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditError('');
  }

  async function saveEdit(todo) {
    const title = editTitle.trim();
    if (!title) {
      setEditError('Todo title is required.');
      return;
    }

    setBusyTodoId(todo.id);
    setEditError('');
    try {
      const updated = await updateTodo(todo.id, { title });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      cancelEdit();
    } catch (err) {
      setEditError(err.message || 'Could not save todo.');
    } finally {
      setBusyTodoId(null);
    }
  }

  async function handleCompleteAll() {
    setCompletingAll(true);
    setError('');
    try {
      await completeAllTodos();
      setTodos((current) => current.map((todo) => ({ ...todo, completed: true })));
    } catch (err) {
      setError(err.message || 'Could not complete all todos.');
    } finally {
      setCompletingAll(false);
    }
  }

  if (loading) {
    return <p className="text-gray-600">Loading todos…</p>;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="text-gray-600">{pendingCount} pending</p>
        </div>
        <button
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={handleCompleteAll}
          disabled={completingAll || pendingCount === 0}
        >
          {completingAll ? 'Completing…' : 'Complete all'}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <form className="mb-6 flex gap-2" onSubmit={handleCreate}>
        <label className="sr-only" htmlFor="new-todo">
          New todo title
        </label>
        <input
          id="new-todo"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
          placeholder="Add a todo"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={creating}
        >
          {creating ? 'Adding…' : 'Add'}
        </button>
      </form>

      {todos.length === 0 ? (
        <p className="rounded border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">No todos yet. Add one above.</p>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            const isBusy = busyTodoId === todo.id;
            return (
              <li key={todo.id} className="rounded bg-white p-4 shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      disabled={isBusy}
                      onChange={() => handleToggle(todo)}
                      aria-label={`Complete ${todo.title}`}
                    />
                    {isEditing ? (
                      <input
                        className="flex-1 rounded border border-gray-300 px-3 py-2"
                        aria-label="Edit todo title"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                      />
                    ) : (
                      <span className={todo.completed ? 'text-gray-500 line-through' : ''}>{todo.title}</span>
                    )}
                  </label>

                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        className="rounded bg-blue-600 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        disabled={isBusy}
                        onClick={() => saveEdit(todo)}
                      >
                        Save
                      </button>
                      <button className="rounded bg-gray-100 px-3 py-2" type="button" onClick={cancelEdit} disabled={isBusy}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="rounded bg-gray-100 px-3 py-2" type="button" onClick={() => beginEdit(todo)}>
                      Edit
                    </button>
                  )}
                </div>
                {isEditing && editError ? (
                  <p className="mt-2 text-sm text-red-700" role="alert">
                    {editError}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
