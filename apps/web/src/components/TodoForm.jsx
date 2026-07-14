import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function TodoForm({ onAdd, isAdding = false }) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const trimmedTitle = title.trim();
  const busy = isAdding || submitting;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!trimmedTitle || busy) return;

    setSubmitting(true);
    try {
      await onAdd(trimmedTitle);
      setTitle('');
    } catch {
      // The parent page owns displaying API errors.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="new-todo">New todo</label>
      <input
        id="new-todo"
        className="todo-input"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a new task"
        disabled={busy}
      />
      <button className="todo-add-button" type="submit" disabled={!trimmedTitle || busy}>
        {busy ? 'Adding…' : '+'}
        <span className="sr-only">Add todo</span>
      </button>
    </form>
  );
}

TodoForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  isAdding: PropTypes.bool,
};
