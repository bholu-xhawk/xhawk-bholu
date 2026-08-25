import React from 'react';
import PropTypes from 'prop-types';

function isUpdating(updatingBookIds, id) {
  if (!updatingBookIds) {
    return false;
  }

  if (typeof updatingBookIds.has === 'function') {
    return updatingBookIds.has(id);
  }

  return updatingBookIds.includes(id);
}

export default function BookTable({
  books,
  onToggleStar,
  updatingBookIds = [],
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <caption className="sr-only">Table of books and starred status</caption>
        <thead className="bg-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <tr>
            <th className="px-4 py-3" scope="col">
              Book Name
            </th>
            <th className="px-4 py-3" scope="col">
              Details
            </th>
            <th className="px-4 py-3" scope="col">
              Authors
            </th>
            <th className="px-4 py-3 text-center" scope="col">
              Starred
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {books.map((book) => {
            const updating = isUpdating(updatingBookIds, book.id);
            const label = book.starred
              ? `Unstar ${book.name}`
              : `Star ${book.name}`;

            return (
              <tr className="align-top" key={book.id}>
                <th
                  className="whitespace-nowrap px-4 py-4 font-semibold text-gray-900"
                  scope="row"
                >
                  {book.name}
                </th>
                <td className="max-w-md px-4 py-4 text-gray-700">
                  {book.details || '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                  {book.authors || '—'}
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    aria-label={label}
                    aria-pressed={book.starred}
                    disabled={updating}
                    onClick={() => onToggleStar(book)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-yellow-300 text-xl text-yellow-500 transition hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span aria-hidden="true">{book.starred ? '★' : '☆'}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

BookTable.propTypes = {
  books: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      details: PropTypes.string,
      authors: PropTypes.string,
      starred: PropTypes.bool.isRequired,
    })
  ).isRequired,
  onToggleStar: PropTypes.func.isRequired,
  updatingBookIds: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ),
    PropTypes.shape({ has: PropTypes.func.isRequired }),
  ]),
};
