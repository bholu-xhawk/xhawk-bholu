import React, { useEffect, useState } from 'react';

const emptyForm = { title: '', description: '', completed: false };

async function readJsonResponse(response) {
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Todo request failed');
  }
  return data;
}

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [lookupId, setLookupId] = useState('');
  const [fetchedTodo, setFetchedTodo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadTodos() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/todos');
      const data = await readJsonResponse(response);
      setTodos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  function updateForm(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function editTodo(todo) {
    setEditingId(todo.id);
    setForm({
      title: todo.title,
      description: todo.description || '',
      completed: todo.completed,
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveTodo(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      title: form.title,
      description: form.description || undefined,
      completed: form.completed,
    };
    const url = editingId ? `/api/todos/${editingId}` : '/api/todos';
    const method = editingId ? 'PUT' : 'POST';

    try {
      await readJsonResponse(
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      );
      cancelEditing();
      await loadTodos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTodoById(event) {
    event.preventDefault();
    if (!lookupId) return;

    setLoading(true);
    setError('');
    setFetchedTodo(null);
    try {
      const response = await fetch(`/api/todos/${lookupId}`);
      const data = await readJsonResponse(response);
      setFetchedTodo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTodo(id) {
    setLoading(true);
    setError('');
    try {
      await readJsonResponse(await fetch(`/api/todos/${id}`, { method: 'DELETE' }));
      if (editingId === id) cancelEditing();
      if (fetchedTodo?.id === id) setFetchedTodo(null);
      await loadTodos();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Todo app</p>
        <h1 className="text-3xl font-bold">Manage todos</h1>
        <p className="mt-2 text-gray-600">Create, edit, fetch, and delete shared todos.</p>
      </div>

      {error ? <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700" role="alert">{error}</div> : null}

      <form className="space-y-4 rounded bg-white p-4 shadow" onSubmit={saveTodo}>
        <h2 className="text-xl font-semibold">{editingId ? `Edit todo #${editingId}` : 'Add a todo'}</h2>
        <label className="block">
          <span className="font-medium">Title</span>
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2"
            name="title"
            value={form.title}
            onChange={updateForm}
            required
          />
        </label>
        <label className="block">
          <span className="font-medium">Description</span>
          <textarea
            className="mt-1 w-full rounded border border-gray-300 p-2"
            name="description"
            value={form.description}
            onChange={updateForm}
            rows="3"
          />
        </label>
        <label className="flex items-center gap-2">
          <input name="completed" type="checkbox" checked={form.completed} onChange={updateForm} />
          <span>Completed</span>
        </label>
        <div className="flex gap-2">
          <button className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
            {editingId ? 'Save edits' : 'Add todo'}
          </button>
          {editingId ? (
            <button className="rounded border border-gray-300 px-4 py-2" type="button" onClick={cancelEditing}>
              Cancel editing
            </button>
          ) : null}
        </div>
      </form>

      <form className="flex flex-wrap items-end gap-3 rounded bg-white p-4 shadow" onSubmit={loadTodoById}>
        <label>
          <span className="block font-medium">Fetch todo by ID</span>
          <input
            className="mt-1 rounded border border-gray-300 p-2"
            min="1"
            type="number"
            value={lookupId}
            onChange={(event) => setLookupId(event.target.value)}
          />
        </label>
        <button className="rounded border border-blue-600 px-4 py-2 font-semibold text-blue-600" disabled={loading} type="submit">
          Get todo
        </button>
        {fetchedTodo ? (
          <p className="text-sm text-gray-700">
            Fetched #{fetchedTodo.id}: <strong>{fetchedTodo.title}</strong>
          </p>
        ) : null}
      </form>

      <div className="rounded bg-white p-4 shadow">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Todo list</h2>
          <button className="rounded border border-gray-300 px-3 py-2" disabled={loading} type="button" onClick={loadTodos}>
            Refresh list
          </button>
        </div>
        {loading ? <p>Loading todos...</p> : null}
        {todos.length === 0 && !loading ? <p className="text-gray-600">No todos yet.</p> : null}
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li className="rounded border border-gray-200 p-3" key={todo.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {todo.completed ? '✓ ' : ''}{todo.title}
                  </h3>
                  {todo.description ? <p className="text-gray-600">{todo.description}</p> : null}
                  <p className="text-sm text-gray-500">ID: {todo.id}</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded border border-gray-300 px-3 py-1" type="button" onClick={() => editTodo(todo)}>
                    Edit
                  </button>
                  <button className="rounded border border-red-600 px-3 py-1 text-red-600" type="button" onClick={() => deleteTodo(todo.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
