import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DeleteTodoDialog from '../components/DeleteTodoDialog.jsx';
import TodoModal from '../components/TodoModal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiRequest } from '../lib/api.js';

const PAGE_SIZE = 10;
const emptyResponse = { items: [], total: 0, page: 1, page_size: PAGE_SIZE };

function formatLabel(value) {
  return value.replace('_', ' ');
}

export default function Home() {
  const { token, clearSession } = useAuth();
  const [todos, setTodos] = useState(emptyResponse);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalTodo, setModalTodo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalPending, setModalPending] = useState(false);
  const [deleteTodo, setDeleteTodo] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status, priority, debouncedSearch, sortBy, sortOrder]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (debouncedSearch) params.set('search', debouncedSearch);
    return params.toString();
  }, [page, status, priority, debouncedSearch, sortBy, sortOrder]);

  const loadTodos = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest(`/todos?${query}`, { token, signal, onUnauthorized: clearSession });
        setTodos(data);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message || 'Failed to load todos');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [query, token, clearSession]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadTodos(controller.signal);
    return () => controller.abort();
  }, [loadTodos]);

  const totalPages = Math.max(1, Math.ceil(todos.total / todos.page_size));
  const canGoPrevious = todos.page > 1;
  const canGoNext = todos.page < totalPages;

  function openCreateModal() {
    setModalTodo(null);
    setModalError('');
    setModalOpen(true);
  }

  function openEditModal(todo) {
    setModalTodo(todo);
    setModalError('');
    setModalOpen(true);
  }

  async function submitTodo(body) {
    setModalPending(true);
    setModalError('');
    try {
      await apiRequest(modalTodo ? `/todos/${modalTodo.id}` : '/todos', {
        method: modalTodo ? 'PUT' : 'POST',
        body,
        token,
        onUnauthorized: clearSession,
      });
      setModalOpen(false);
      await loadTodos();
    } catch (err) {
      setModalError(err.message || 'Failed to save todo');
    } finally {
      setModalPending(false);
    }
  }

  async function confirmDelete() {
    setDeletePending(true);
    setDeleteError('');
    try {
      await apiRequest(`/todos/${deleteTodo.id}`, { method: 'DELETE', token, onUnauthorized: clearSession });
      setDeleteTodo(null);
      if (todos.items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadTodos();
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete todo');
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="text-gray-600">{todos.total} total todos</p>
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-white" type="button" onClick={openCreateModal}>New todo</button>
      </header>

      <form className="grid gap-4 rounded bg-white p-4 shadow md:grid-cols-4" aria-label="Todo filters" onSubmit={(event) => event.preventDefault()}>
        <label className="block">
          <span>Search titles</span>
          <input className="mt-1 w-full rounded border p-2" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="block">
          <span>Status</span>
          <select className="mt-1 w-full rounded border p-2" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Any status</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
        </label>
        <label className="block">
          <span>Priority</span>
          <select className="mt-1 w-full rounded border p-2" value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="">Any priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block">
          <span>Sort</span>
          <select className="mt-1 w-full rounded border p-2" value={`${sortBy}:${sortOrder}`} onChange={(event) => {
            const [nextSortBy, nextSortOrder] = event.target.value.split(':');
            setSortBy(nextSortBy);
            setSortOrder(nextSortOrder);
          }}>
            <option value="created_at:desc">Newest created</option>
            <option value="created_at:asc">Oldest created</option>
            <option value="due_date:asc">Due date ascending</option>
            <option value="due_date:desc">Due date descending</option>
          </select>
        </label>
      </form>

      {loading ? <p role="status">Loading todos…</p> : null}
      {error ? (
        <div role="alert" className="rounded border border-red-300 bg-red-50 p-4">
          <p>{error}</p>
          <button className="mt-2 rounded border px-3 py-1" type="button" onClick={() => loadTodos()}>Retry</button>
        </div>
      ) : null}
      {!loading && !error && todos.items.length === 0 ? <p className="rounded bg-white p-6 shadow">No todos match your current filters.</p> : null}

      {!error && todos.items.length > 0 ? (
        <div className="overflow-x-auto rounded bg-white shadow">
          <table className="min-w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Due date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todos.items.map((todo) => (
                <tr className="border-t" key={todo.id}>
                  <td className="p-3">{todo.title}</td>
                  <td className="p-3 capitalize">{formatLabel(todo.status)}</td>
                  <td className="p-3 capitalize">{todo.priority}</td>
                  <td className="p-3">{todo.due_date || '—'}</td>
                  <td className="space-x-2 p-3">
                    <button className="text-blue-600 hover:underline" type="button" onClick={() => openEditModal(todo)}>Edit</button>
                    <button className="text-red-600 hover:underline" type="button" onClick={() => { setDeleteError(''); setDeleteTodo(todo); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <nav className="flex items-center justify-end gap-3" aria-label="Pagination">
        <span>Page {todos.page} of {totalPages}</span>
        <button className="rounded border px-3 py-1 disabled:opacity-50" type="button" disabled={!canGoPrevious} onClick={() => setPage((current) => current - 1)}>
          Previous
        </button>
        <button className="rounded border px-3 py-1 disabled:opacity-50" type="button" disabled={!canGoNext} onClick={() => setPage((current) => current + 1)}>
          Next
        </button>
      </nav>

      {modalOpen ? (
        <TodoModal
          todo={modalTodo}
          pending={modalPending}
          error={modalError}
          onClose={() => setModalOpen(false)}
          onSubmit={submitTodo}
        />
      ) : null}
      <DeleteTodoDialog
        todo={deleteTodo}
        pending={deletePending}
        error={deleteError}
        onCancel={() => setDeleteTodo(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
