import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const emptyForm = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '' };

export default function TodoModal({ todo = null, pending, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setForm(
      todo
        ? {
            title: todo.title,
            description: todo.description || '',
            status: todo.status,
            priority: todo.priority,
            due_date: todo.due_date || '',
          }
        : emptyForm
    );
    setValidationError('');
  }, [todo]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setValidationError('Title is required');
      return;
    }
    setValidationError('');
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 p-6" role="presentation">
      <section className="mx-auto max-w-lg rounded bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="todo-modal-title">
        <h2 id="todo-modal-title" className="mb-4 text-2xl font-bold">{todo ? 'Edit todo' : 'Create todo'}</h2>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block">
            <span>Title</span>
            <input className="mt-1 w-full rounded border p-2" value={form.title} onChange={(event) => update('title', event.target.value)} />
          </label>
          <label className="block">
            <span>Description</span>
            <textarea
              className="mt-1 w-full rounded border p-2"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span>Status</span>
              <select className="mt-1 w-full rounded border p-2" value={form.status} onChange={(event) => update('status', event.target.value)}>
                <option value="todo">Todo</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className="block">
              <span>Priority</span>
              <select className="mt-1 w-full rounded border p-2" value={form.priority} onChange={(event) => update('priority', event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="block">
              <span>Due date</span>
              <input
                className="mt-1 w-full rounded border p-2"
                type="date"
                value={form.due_date}
                onChange={(event) => update('due_date', event.target.value)}
              />
            </label>
          </div>
          {validationError || error ? <p role="alert" className="text-red-700">{validationError || error}</p> : null}
          <div className="flex justify-end gap-3">
            <button className="rounded border px-4 py-2" type="button" onClick={onClose} disabled={pending}>Cancel</button>
            <button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save todo'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

TodoModal.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    due_date: PropTypes.string,
  }),
  pending: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

