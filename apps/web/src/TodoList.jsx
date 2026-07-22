import React, { useEffect, useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  async function fetchTodos() {
    setLoading(true);
    setError('');
    try {
      const data = await requestJson('/api/todos');
      setTodos(data);
      setSelectedIds((current) => current.filter((id) => data.some((todo) => todo.id === id)));
    } catch (err) {
      setError('Unable to load todos. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setSubmitting(true);
    setError('');
    try {
      const todo = await requestJson('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      });
      setTodos((current) => [...current, todo]);
      setTitle('');
    } catch (err) {
      setError('Unable to add todo. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSelection(id) {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    ));
  }

  async function handleDelete(id) {
    setError('');
    try {
      await requestJson(`/api/todos/${id}`, { method: 'DELETE' });
      setTodos((current) => current.filter((todo) => todo.id !== id));
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
    } catch (err) {
      setError('Unable to delete todo. Please try again.');
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;

    setError('');
    try {
      await requestJson('/api/todos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setTodos((current) => current.filter((todo) => !selectedIds.includes(todo.id)));
      setSelectedIds([]);
    } catch (err) {
      setError('Unable to delete selected todos. Please try again.');
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Todos</h1>
        <p className="mt-2 text-gray-600">Create and manage your todo list.</p>
      </div>

      <form className="flex gap-2" onSubmit={handleAdd}>
        <label className="sr-only" htmlFor="todo-title">Todo title</label>
        <input
          className="flex-1 rounded border border-gray-300 px-3 py-2"
          id="todo-title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a todo"
          type="text"
          value={title}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={submitting || title.trim().length === 0}
          type="submit"
        >
          Add todo
        </button>
      </form>

      {error ? <p role="alert" className="text-red-600">{error}</p> : null}
      {loading ? <p>Loading todos...</p> : null}

      {!loading && todos.length === 0 ? <p>No todos yet.</p> : null}

      {!loading && todos.length > 0 ? (
        <div className="space-y-4">
          <button
            className="rounded bg-red-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400"
            disabled={selectedIds.length === 0}
            onClick={handleDeleteSelected}
            type="button"
          >
            Delete selected
          </button>

          <ul className="divide-y divide-gray-200 rounded border border-gray-200 bg-white">
            {todos.map((todo) => (
              <li className="flex items-center gap-3 p-3" key={todo.id}>
                <input
                  aria-label={`Select ${todo.title}`}
                  checked={selectedIds.includes(todo.id)}
                  onChange={() => toggleSelection(todo.id)}
                  type="checkbox"
                />
                <span className="flex-1">{todo.title}</span>
                <button
                  className="rounded border border-red-600 px-3 py-1 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(todo.id)}
                  type="button"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
