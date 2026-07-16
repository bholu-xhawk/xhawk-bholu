import React, { useEffect, useState } from 'react';

/* global __API_BASE_URL__ */
const API_BASE_URL = typeof __API_BASE_URL__ === 'string' ? __API_BASE_URL__ : 'http://localhost:3001/api';

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    let message = 'Todo request failed';
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch (err) {
      // Ignore malformed error bodies and keep the generic message.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTodos() {
      setLoading(true);
      setError('');
      try {
        const data = await requestJson('/todos');
        if (active) setTodos(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load todos');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTodos();

    return () => {
      active = false;
    };
  }, []);

  async function createTodo(event) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setSaving(true);
    setError('');
    try {
      const todo = await requestJson('/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setTodos((current) => [...current, todo]);
      setNewTitle('');
    } catch (err) {
      setError(err.message || 'Failed to create todo');
    } finally {
      setSaving(false);
    }
  }

  async function updateTodo(id, data) {
    setSaving(true);
    setError('');
    try {
      const updated = await requestJson(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)));
      return updated;
    } catch (err) {
      setError(err.message || 'Failed to update todo');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function toggleTodo(todo) {
    await updateTodo(todo.id, { completed: !todo.completed });
  }

  function startEditing(todo) {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  async function renameTodo(event) {
    event.preventDefault();
    const title = editingTitle.trim();
    if (!title || editingId === null) return;

    const updated = await updateTodo(editingId, { title });
    if (updated) {
      setEditingId(null);
      setEditingTitle('');
    }
  }

  async function deleteTodo(id) {
    setSaving(true);
    setError('');
    try {
      await requestJson(`/todos/${id}`, { method: 'DELETE' });
      setTodos((current) => current.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete todo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-bold">Todos</h1>
      <p className="mt-2 text-gray-600">Track tasks, mark them complete, rename them, or remove them.</p>

      <form className="mt-6 flex gap-2" onSubmit={createTodo}>
        <label className="sr-only" htmlFor="new-todo-title">New todo title</label>
        <input
          id="new-todo-title"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a todo"
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          disabled={saving || !newTitle.trim()}
          type="submit"
        >
          Add Todo
        </button>
      </form>

      {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700" role="alert">{error}</div> : null}
      {loading ? <p className="mt-4">Loading todos...</p> : null}

      {!loading && todos.length === 0 ? <p className="mt-4 text-gray-600">No todos yet.</p> : null}

      <ul className="mt-6 space-y-3">
        {todos.map((todo) => (
          <li key={todo.id} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            {editingId === todo.id ? (
              <form className="flex gap-2" onSubmit={renameTodo}>
                <label className="sr-only" htmlFor={`edit-todo-${todo.id}`}>Edit title for {todo.title}</label>
                <input
                  id={`edit-todo-${todo.id}`}
                  aria-label={`Edit title for ${todo.title}`}
                  className="flex-1 rounded border border-gray-300 px-3 py-2"
                  value={editingTitle}
                  onChange={(event) => setEditingTitle(event.target.value)}
                />
                <button className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-60" disabled={saving || !editingTitle.trim()} type="submit">
                  Save
                </button>
                <button className="rounded border border-gray-300 px-3 py-2" type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  aria-label={`Mark ${todo.title} ${todo.completed ? 'incomplete' : 'complete'}`}
                  checked={todo.completed}
                  disabled={saving}
                  onChange={() => toggleTodo(todo)}
                  type="checkbox"
                />
                <span className={todo.completed ? 'flex-1 text-gray-500 line-through' : 'flex-1'}>{todo.title}</span>
                <button className="text-blue-600 hover:underline" type="button" onClick={() => startEditing(todo)}>
                  Edit {todo.title}
                </button>
                <button className="text-red-600 hover:underline" disabled={saving} type="button" onClick={() => deleteTodo(todo.id)}>
                  Delete {todo.title}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
