import React, { useEffect, useState } from 'react';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function fetchTodos() {
    try {
      setLoading(true);
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTodos(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTodos();
  }, []);

  async function createTodo(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error('Failed to create');
      setTitle('');
      setDescription('');
      await fetchTodos();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleCompleted(todo) {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function updateInline(todo, patch) {
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteTodo(id) {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Todos</h1>
      <form onSubmit={createTodo} className="mb-4 flex gap-2">
        <input
          aria-label="title"
          className="border p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          aria-label="description"
          className="border p-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-3 py-2" type="submit">Add</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p role="alert" className="text-red-600">{error}</p>}

      <ul>
        {todos.map((todo) => (
          <li key={todo.id} className="border-b py-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleCompleted(todo)}
              aria-label={`toggle-${todo.id}`}
            />
            <input
              className="border p-1 flex-1"
              value={todo.title}
              onChange={(e) => updateInline(todo, { title: e.target.value })}
              aria-label={`title-${todo.id}`}
            />
            <input
              className="border p-1 flex-1"
              value={todo.description || ''}
              onChange={(e) => updateInline(todo, { description: e.target.value })}
              aria-label={`description-${todo.id}`}
            />
            <button className="text-red-600" onClick={() => deleteTodo(todo.id)} aria-label={`delete-${todo.id}`}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
