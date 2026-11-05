import React, { useCallback, useEffect, useRef, useState } from 'react';
import { listCustomers } from '../api/customers.js';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status' },
  { key: 'signedUpAt', label: 'Signed up' },
];

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export default function Customers() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('signedUpAt');
  const [direction, setDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    setLoading(true);
    setError('');

    listCustomers({ search, sort, direction, page, signal: controller.signal })
      .then((result) => {
        if (requestId.current !== currentRequest) return;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || requestId.current !== currentRequest) return;
        setData(null);
        setError(err.message || 'Unable to load customers.');
        setLoading(false);
      });

    return () => controller.abort();
  }, [search, sort, direction, page, retryCount]);

  const handleSort = useCallback(
    (field) => {
      if (sort === field) {
        setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      } else {
        setSort(field);
        setDirection('asc');
      }
      setPage(1);
    },
    [sort]
  );

  const hasRows = data?.items?.length > 0;
  const totalPages = data?.totalPages ?? 0;
  const canGoPrevious = !loading && page > 1;
  const canGoNext = !loading && totalPages > page;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="mt-2 text-gray-600">Search, sort, and page through customer records.</p>
      </div>

      <label className="block max-w-md text-sm font-medium text-gray-700" htmlFor="customer-search">
        Search customers
        <input
          id="customer-search"
          className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search name or email"
        />
      </label>

      {loading && <p role="status">Loading customers...</p>}

      {error && (
        <div role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-800">
          <p>{error}</p>
          <button className="mt-3 rounded bg-red-700 px-3 py-2 text-white" type="button" onClick={() => setRetryCount((count) => count + 1)}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && !hasRows && (
        <p>{search ? 'No customers match your search.' : 'No customers yet.'}</p>
      )}

      {!error && hasRows && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <caption className="sr-only">Customer list</caption>
              <thead className="bg-gray-100">
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      aria-sort={sort === column.key ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                      scope="col"
                    >
                      <button className="font-semibold hover:underline" type="button" onClick={() => handleSort(column.key)}>
                        {column.label}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-3">{customer.name}</td>
                    <td className="px-4 py-3">{customer.email}</td>
                    <td className="px-4 py-3">{customer.company}</td>
                    <td className="px-4 py-3">{customer.status}</td>
                    <td className="px-4 py-3">{formatDate(customer.signedUpAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <p>
              Page {data.page} of {data.totalPages || 1} · {data.total} customers
            </p>
            <button className="rounded border px-3 py-2 disabled:opacity-50" type="button" disabled={!canGoPrevious} onClick={() => setPage((current) => current - 1)}>
              Previous
            </button>
            <button className="rounded border px-3 py-2 disabled:opacity-50" type="button" disabled={!canGoNext} onClick={() => setPage((current) => current + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
