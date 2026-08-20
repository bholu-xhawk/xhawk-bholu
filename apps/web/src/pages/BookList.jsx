import React, { useEffect, useMemo, useState } from 'react';

const COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'publicationDate', label: 'Publication Date' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatPublicationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export default function BookList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortBy,
      sortDirection,
    });
    return params.toString();
  }, [page, pageSize, sortBy, sortDirection]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooks() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/booklist?${queryString}`, { signal: controller.signal });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error || 'Failed to load booklist');
        }
        setData(body);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load booklist');
        setData(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadBooks();

    return () => controller.abort();
  }, [queryString]);

  function handleSort(nextSortBy) {
    setPage(1);
    if (nextSortBy === sortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(nextSortBy);
      setSortDirection('asc');
    }
  }

  function handlePageSizeChange(event) {
    setPage(1);
    setPageSize(Number(event.target.value));
  }

  const books = data?.items || [];
  const totalPages = data?.totalPages || 0;
  const showingStart = data?.totalItems ? (page - 1) * pageSize + 1 : 0;
  const showingEnd = data?.totalItems ? Math.min(page * pageSize, data.totalItems) : 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Booklist</h1>
        <p className="mt-2 text-sm text-gray-600">Browse books by title, author, and publication date.</p>
      </div>

      <div className="flex flex-col gap-3 rounded bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700" aria-live="polite">
          {loading ? 'Loading books…' : `Showing ${showingStart}-${showingEnd} of ${data?.totalItems || 0} books`}
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Page size
          <select
            className="rounded border border-gray-300 px-2 py-1"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <caption className="sr-only">Sortable paginated list of books</caption>
          <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 font-semibold"
                  aria-sort={sortBy === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-left hover:text-blue-700"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    <span aria-hidden="true">{sortBy === column.key ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.map((book) => (
              <tr key={book.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{book.title}</td>
                <td className="px-4 py-3 text-gray-700">{book.author}</td>
                <td className="px-4 py-3 text-gray-700">{formatPublicationDate(book.publicationDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && !error && books.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-600">No books found.</div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700">Page {totalPages === 0 ? 0 : page} of {totalPages}</div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded border px-3 py-1 disabled:opacity-50" type="button" onClick={() => setPage(1)} disabled={page <= 1 || loading}>
            First
          </button>
          <button className="rounded border px-3 py-1 disabled:opacity-50" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
            Previous
          </button>
          <button className="rounded border px-3 py-1 disabled:opacity-50" type="button" onClick={() => setPage((current) => current + 1)} disabled={loading || totalPages === 0 || page >= totalPages}>
            Next
          </button>
          <button className="rounded border px-3 py-1 disabled:opacity-50" type="button" onClick={() => setPage(totalPages)} disabled={loading || totalPages === 0 || page >= totalPages}>
            Last
          </button>
        </div>
      </div>
    </section>
  );
}
