import React, { useEffect, useMemo, useState } from 'react';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
];

async function parseResponse(response) {
  if (response.status === 204) return null;

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error || 'Todo request failed');
  }

  return body;
}

async function apiRequest(path, options) {
  const response = await fetch(path, {
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });
  return parseResponse(response);
}

function emptyMessage(filter) {
  if (filter === 'active') return 'No active todos.';
  if (filter === 'done') return 'No done todos.';
  return 'No todos yet. Add your first task above.';
}

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pendingIds, setPendingIds] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadTodos() {
      setLoading(true);
      setError('');
      try {
        const loadedTodos = await apiRequest('/api/todos');
        if (!ignore) setTodos(loadedTodos);
      } catch (err) {
        if (!ignore) setError('Could not load todos. Please try again.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadTodos();

    return () => {
      ignore = true;
    };
  }, []);

  const visibleTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((todo) => !todo.completed);
    if (filter === 'done') return todos.filter((todo) => todo.completed);
    return todos;
  }, [filter, todos]);

  const setPending = (id, isPending) => {
    setPendingIds((current) => {
      const next = { ...current };
      if (isPending) next[id] = true;
      else delete next[id];
      return next;
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setError('Enter a todo title before adding it.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const created = await apiRequest('/api/todos', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setTodos((current) => [...current, created]);
      setNewTitle('');
    } catch (err) {
      setError('Could not add the todo. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setError('');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const replaceTodo = (updatedTodo) => {
    setTodos((current) => current.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)));
  };

  const handleSave = async (id) => {
    const title = editingTitle.trim();
    if (!title) {
      setError('Todo titles cannot be blank.');
      return;
    }

    setPending(id, true);
    setError('');
    try {
      const updated = await apiRequest(`/api/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title }),
      });
      replaceTodo(updated);
      cancelEditing();
    } catch (err) {
      setError('Could not save the todo. Please try again.');
    } finally {
      setPending(id, false);
    }
  };

  const handleToggle = async (todo) => {
    setPending(todo.id, true);
    setError('');
    try {
      const updated = await apiRequest(`/api/todos/${todo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !todo.completed }),
      });
      replaceTodo(updated);
    } catch (err) {
      setError('Could not update the todo. Please try again.');
    } finally {
      setPending(todo.id, false);
    }
  };

  const handleDelete = async (todo) => {
    setPending(todo.id, true);
    setError('');
    try {
      await apiRequest(`/api/todos/${todo.id}`, { method: 'DELETE' });
      setTodos((current) => current.filter((item) => item.id !== todo.id));
      if (editingId === todo.id) cancelEditing();
    } catch (err) {
      setError('Could not delete the todo. Please try again.');
    } finally {
      setPending(todo.id, false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="todos-heading">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Todo list</p>
        <h1 id="todos-heading" className="text-3xl font-bold">Todos</h1>
        <p className="mt-2 text-gray-600">Create tasks, track what is active, and keep completed work visible.</p>
      </div>

      <form className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row" onSubmit={handleCreate}>
        <label className="sr-only" htmlFor="new-todo">New todo title</label>
        <input
          id="new-todo"
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="What needs doing?"
          disabled={creating}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
          type="submit"
          disabled={creating}
        >
          {creating ? 'Adding…' : 'Add todo'}
        </button>
      </form>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3" aria-label="Todo filters">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            className={`rounded-full border px-4 py-2 font-medium ${
              filter === item.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700'
            }`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-white shadow">
        {loading ? <p className="p-4 text-gray-600">Loading todos…</p> : null}

        {!loading && visibleTodos.length === 0 ? <p className="p-4 text-gray-600">{emptyMessage(filter)}</p> : null}

        {!loading && visibleTodos.length > 0 ? (
          <ul className="divide-y divide-gray-200" aria-label="Todo list items">
            {visibleTodos.map((todo) => {
              const isPending = Boolean(pendingIds[todo.id]);
              const isEditing = editingId === todo.id;

              return (
                <li key={todo.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <label className="flex flex-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggle(todo)}
                      disabled={isPending}
                      aria-label={`Mark ${todo.title} ${todo.completed ? 'active' : 'done'}`}
                    />
                    {isEditing ? (
                      <input
                        className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2"
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        disabled={isPending}
                        aria-label="Edit todo title"
                      />
                    ) : (
                      <span className={todo.completed ? 'text-gray-500 line-through' : ''}>{todo.title}</span>
                    )}
                  </label>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-green-300"
                          onClick={() => handleSave(todo.id)}
                          disabled={isPending}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                          onClick={cancelEditing}
                          disabled={isPending}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                        onClick={() => startEditing(todo)}
                        disabled={isPending}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:text-red-300"
                      onClick={() => handleDelete(todo)}
                      disabled={isPending}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
