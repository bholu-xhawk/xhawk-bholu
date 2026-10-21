import React from 'react';
import PropTypes from 'prop-types';

export default function DeleteTodoDialog({ todo = null, pending, error, onCancel, onConfirm }) {
  if (!todo) return null;
  return (
    <div className="fixed inset-0 bg-black/40 p-6" role="presentation">
      <section className="mx-auto max-w-md rounded bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <h2 id="delete-dialog-title" className="mb-3 text-2xl font-bold">Delete todo?</h2>
        <p>Delete “{todo.title}”? This action cannot be undone.</p>
        {error ? <p role="alert" className="mt-3 text-red-700">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded border px-4 py-2" type="button" onClick={onCancel} disabled={pending}>Cancel</button>
          <button className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60" type="button" onClick={onConfirm} disabled={pending}>
            {pending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </section>
    </div>
  );
}

DeleteTodoDialog.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string.isRequired,
  }),
  pending: PropTypes.bool.isRequired,
  error: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

