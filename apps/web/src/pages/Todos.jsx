import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeAllTodos, createTodo, getTodos, updateTodo } from '../api.js';

function replaceTodo(todos, updatedTodo) {
  return todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo));
}

export default function Todos() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const hasIncompleteTodos = useMemo(() => todos.some((todo) => !todo.completed), [todos]);

  const handleError = useCallback((err) => {
    if (err.status === 401) {
      navigate('/login');
      return;
    }

    setError(err.message || 'Something went wrong. Please try again.');
  }, [navigate]);

  useEffect(() => {
    let ignore = false;

    async function loadTodos() {
      setIsLoading(true);
      setError('');

      try {
        const loadedTodos = await getTodos();
        if (!ignore) setTodos(loadedTodos);
      } catch (err) {
        if (!ignore) handleError(err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadTodos();

    return () => {
      ignore = true;
    };
  }, [handleError]);

  async function handleAdd(event) {
    event.preventDefault();
    const title = newTitle.trim();
    setError('');

    if (!title) {
      setError('Todo title is required.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await createTodo(title);
      setTodos((currentTodos) => [...currentTodos, created]);
      setNewTitle('');
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(todo) {
    setError('');
    setIsSaving(true);

    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((currentTodos) => replaceTodo(currentTodos, updated));
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(todo) {
    setError('');
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingTitle('');
  }

  async function saveEditing() {
    const title = editingTitle.trim();
    setError('');

    if (!title) {
      setError('Todo title is required.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateTodo(editingId, { title });
      setTodos((currentTodos) => replaceTodo(currentTodos, updated));
      cancelEditing();
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  }

  function handleEditKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveEditing();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  async function handleCompleteAll() {
    setError('');
    setIsSaving(true);

    try {
      const completedTodos = await completeAllTodos();
      setTodos(completedTodos);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="mt-2 text-gray-600">Keep track of your private tasks.</p>
        </div>
        <button
          className="rounded border border-blue-600 px-3 py-2 text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={handleCompleteAll}
          disabled={!hasIncompleteTodos || isSaving}
        >
          Mark all done
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">
          {error}
        </p>
      ) : null}

      <form className="mt-6 flex gap-2" onSubmit={handleAdd}>
        <label className="sr-only" htmlFor="new-todo">New todo title</label>
        <input
          id="new-todo"
          aria-label="New todo title"
          className="min-w-0 flex-1 rounded border border-gray-300 p-2"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a todo"
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={isSaving}
        >
          Add todo
        </button>
      </form>

      {isLoading ? <p role="status" className="mt-6">Loading todos…</p> : null}

      {!isLoading && todos.length === 0 ? (
        <p className="mt-6 rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">
          You do not have any todos yet.
        </p>
      ) : null}

      {!isLoading && todos.length > 0 ? (
        <ul className="mt-6 divide-y divide-gray-200 rounded border border-gray-200 bg-white">
          {todos.map((todo) => (
            <li className="flex items-center gap-3 p-4" key={todo.id}>
              <input
                aria-label={`${todo.completed ? 'Mark' : 'Complete'} ${todo.title}`}
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
                disabled={isSaving}
              />

              {editingId === todo.id ? (
                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  <label className="sr-only" htmlFor={`edit-${todo.id}`}>Edit todo title</label>
                  <input
                    id={`edit-${todo.id}`}
                    aria-label="Edit todo title"
                    className="min-w-0 flex-1 rounded border border-gray-300 p-2"
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onKeyDown={handleEditKeyDown}
                  />
                  <button type="button" className="rounded bg-blue-600 px-3 py-2 text-white" onClick={saveEditing}>
                    Save
                  </button>
                  <button type="button" className="rounded border px-3 py-2" onClick={cancelEditing}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className={`min-w-0 flex-1 ${todo.completed ? 'text-gray-500 line-through' : ''}`}>
                    {todo.title}
                  </span>
                  <button type="button" className="rounded border px-3 py-2" onClick={() => startEditing(todo)}>
                    Edit
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
