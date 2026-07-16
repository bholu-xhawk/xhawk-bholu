import React, { useEffect, useState } from 'react';
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api/todos.js';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError('');
        const data = await listTodos();
        if (active) setTodos(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load todos');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    try {
      setSaving(true);
      setError('');
      const todo = await createTodo(title);
      setTodos((current) => [...current, todo]);
      setNewTitle('');
    } catch (err) {
      setError(err.message || 'Failed to add todo');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(todo) {
    try {
      setSaving(true);
      setError('');
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Failed to update todo');
    } finally {
      setSaving(false);
    }
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  async function handleSave(todo) {
    const title = editingTitle.trim();
    if (!title) return;

    try {
      setSaving(true);
      setError('');
      const updated = await updateTodo(todo.id, { title });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
      setEditingTitle('');
    } catch (err) {
      setError(err.message || 'Failed to update todo');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(todo) {
    try {
      setSaving(true);
      setError('');
      await deleteTodo(todo.id);
      setTodos((current) => current.filter((item) => item.id !== todo.id));
    } catch (err) {
      setError(err.message || 'Failed to delete todo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Todo app</p>
        <h1 className="text-3xl font-bold">Todos</h1>
        <p className="mt-2 text-gray-600">Track small tasks in the local development API.</p>
      </div>

      <form className="flex gap-3 rounded-lg bg-white p-4 shadow" onSubmit={handleAdd}>
        <label className="sr-only" htmlFor="new-todo-title">New todo title</label>
        <input
          id="new-todo-title"
          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a new todo"
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={saving || !newTitle.trim()}
          type="submit"
        >
          Add todo
        </button>
      </form>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700" role="alert">{error}</div> : null}

      {loading ? (
        <p className="text-gray-600">Loading todos...</p>
      ) : todos.length === 0 ? (
        <p className="rounded bg-white p-4 text-gray-600 shadow">No todos yet.</p>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li key={todo.id} className="rounded-lg bg-white p-4 shadow">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3">
                  <input
                    aria-label={`Mark ${todo.title} ${todo.completed ? 'incomplete' : 'complete'}`}
                    checked={todo.completed}
                    className="h-5 w-5"
                    disabled={saving}
                    onChange={() => handleToggle(todo)}
                    type="checkbox"
                  />
                  {editingId === todo.id ? (
                    <input
                      aria-label="Edit todo title"
                      className="rounded border border-gray-300 px-3 py-2"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                    />
                  ) : (
                    <span className={todo.completed ? 'text-gray-500 line-through' : 'font-medium'}>{todo.title}</span>
                  )}
                </label>

                <div className="flex gap-2">
                  {editingId === todo.id ? (
                    <>
                      <button
                        className="rounded border border-blue-600 px-3 py-1 text-blue-600 hover:bg-blue-50"
                        disabled={saving || !editingTitle.trim()}
                        onClick={() => handleSave(todo)}
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
                        disabled={saving}
                        onClick={() => setEditingId(null)}
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
                      disabled={saving}
                      onClick={() => startEditing(todo)}
                      type="button"
                    >
                      Edit {todo.title}
                    </button>
                  )}
                  <button
                    className="rounded border border-red-300 px-3 py-1 text-red-600 hover:bg-red-50"
                    disabled={saving}
                    onClick={() => handleDelete(todo)}
                    type="button"
                  >
                    Delete {todo.title}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
