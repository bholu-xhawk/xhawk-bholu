import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ApiError, completeAllTodos, createTodo, listTodos, updateTodo } from '../api.js';

const todoShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  completed: PropTypes.bool.isRequired,
});

function TodoRow({ todo, onReplace }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) setDraftTitle(todo.title);
  }, [isEditing, todo.title]);

  async function saveTitle() {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      setError('Title is required');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const payload = await updateTodo(todo.id, { title: trimmed });
      onReplace(payload.todo);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Could not save todo');
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCompleted(event) {
    setError('');
    setIsSaving(true);
    try {
      const payload = await updateTodo(todo.id, { completed: event.target.checked });
      onReplace(payload.todo);
    } catch (err) {
      setError(err.message || 'Could not update todo');
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEdit() {
    setDraftTitle(todo.title);
    setError('');
    setIsEditing(false);
  }

  return (
    <li className="rounded border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3">
          <input
            aria-label={`Complete ${todo.title}`}
            type="checkbox"
            checked={todo.completed}
            disabled={isSaving}
            onChange={toggleCompleted}
          />
          {isEditing ? (
            <input
              aria-label={`Edit title for ${todo.title}`}
              className="rounded border border-gray-300 p-2"
              value={draftTitle}
              disabled={isSaving}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') saveTitle();
                if (event.key === 'Escape') cancelEdit();
              }}
              autoFocus
            />
          ) : (
            <span className={todo.completed ? 'text-gray-500 line-through' : ''}>{todo.title}</span>
          )}
        </label>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-60" type="button" onClick={saveTitle} disabled={isSaving}>Save</button>
              <button className="rounded border px-3 py-1 text-sm" type="button" onClick={cancelEdit} disabled={isSaving}>Cancel</button>
            </>
          ) : (
            <button className="rounded border px-3 py-1 text-sm" type="button" onClick={() => setIsEditing(true)}>Edit</button>
          )}
        </div>
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
    </li>
  );
}

TodoRow.propTypes = {
  todo: todoShape.isRequired,
  onReplace: PropTypes.func.isRequired,
};

export default function Todos() {
  const navigate = useNavigate();
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isCompletingAll, setIsCompletingAll] = useState(false);

  const incompleteCount = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  const handleError = useCallback((err, fallback) => {
    if (err instanceof ApiError && err.status === 401) {
      navigate('/login', { replace: true });
      return;
    }
    setError(err.message || fallback);
  }, [navigate]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listTodos()
      .then((payload) => {
        if (active) setTodos(payload.todos);
      })
      .catch((err) => {
        if (active) handleError(err, 'Could not load todos');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [handleError]);

  async function addTodo(event) {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setError('Title is required');
      return;
    }

    setError('');
    setIsAdding(true);
    try {
      const payload = await createTodo(trimmed);
      setTodos((current) => [payload.todo, ...current]);
      setNewTitle('');
    } catch (err) {
      handleError(err, 'Could not add todo');
    } finally {
      setIsAdding(false);
    }
  }

  async function completeAll() {
    setError('');
    setIsCompletingAll(true);
    try {
      const payload = await completeAllTodos();
      setTodos(payload.todos);
    } catch (err) {
      handleError(err, 'Could not complete todos');
    } finally {
      setIsCompletingAll(false);
    }
  }

  function replaceTodo(nextTodo) {
    setTodos((current) => current.map((todo) => (todo.id === nextTodo.id ? nextTodo : todo)));
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="text-sm text-gray-600">{incompleteCount} incomplete</p>
        </div>
        <button
          className="rounded bg-green-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          type="button"
          onClick={completeAll}
          disabled={loading || isCompletingAll || incompleteCount === 0}
        >
          {isCompletingAll ? 'Completing…' : 'Mark all done'}
        </button>
      </div>

      <form className="mb-6 flex gap-2" onSubmit={addTodo}>
        <label className="sr-only" htmlFor="new-todo">New todo</label>
        <input
          className="flex-1 rounded border border-gray-300 p-2"
          id="new-todo"
          placeholder="Add a todo"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          disabled={isAdding}
        />
        <button className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={isAdding}>
          {isAdding ? 'Adding…' : 'Add todo'}
        </button>
      </form>

      {error ? <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-red-700">{error}</p> : null}
      {loading ? <p>Loading todos…</p> : null}
      {!loading && todos.length === 0 ? <p>No todos yet. Add your first todo above.</p> : null}
      {!loading && todos.length > 0 ? (
        <ul className="space-y-3" aria-label="Todo list">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} onReplace={replaceTodo} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
