import React, { useEffect, useState } from 'react';
import { listTodos, addTodo, updateTodo, deleteTodo } from '../api/todos';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newText, setNewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listTodos();
        if (mounted) setTodos(data || []);
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load todos');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function onAdd(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await addTodo(newText.trim());
      setTodos(prev => [...prev, created]);
      setNewText('');
    } catch (err) {
      setError(err.message || 'Failed to add todo');
    } finally {
      setSubmitting(false);
    }
  }

  async function onToggle(id, completed) {
    try {
      const updated = await updateTodo(id, { completed });
      setTodos(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err.message || 'Failed to update todo');
    }
  }

  async function onDelete(id) {
    try {
      await deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete todo');
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Todo App</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}
      <form onSubmit={onAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Add a new todo"
          className="flex-1 px-3 py-2 border rounded"
          disabled={submitting}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={submitting}
        >
          Add
        </button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {todos.map(todo => (
            <li key={todo.id} className="flex items-center justify-between p-3 bg-white rounded shadow">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!todo.completed}
                  onChange={e => onToggle(todo.id, e.target.checked)}
                />
                <span className={todo.completed ? 'line-through text-gray-500' : ''}>{todo.text}</span>
              </label>
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => onDelete(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

