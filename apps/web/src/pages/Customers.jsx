import React, { useEffect, useRef, useState } from 'react';
import { listCustomers } from '../api/customers.js';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Signed up' },
];

function formatStatus(status) {
  return status
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function nextDirection(sortBy, sortDirection, key) {
  if (sortBy === key) return sortDirection === 'asc' ? 'desc' : 'asc';
  return key === 'createdAt' ? 'desc' : 'asc';
}

export default function Customers() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    const controller = new AbortController();

    setStatus('loading');
    setError('');

    listCustomers({
      search,
      page,
      sortBy,
      sortDirection,
      signal: controller.signal,
    })
      .then((data) => {
        if (requestId.current !== currentRequestId) return;
        setCustomers(data.customers);
        setPagination(data.pagination);
        setStatus('success');
      })
      .catch((err) => {
        if (requestId.current !== currentRequestId || err.name === 'AbortError') return;
        setError(err.message || 'Failed to load customers');
        setStatus('error');
      });

    return () => controller.abort();
  }, [search, page, sortBy, sortDirection, retryCount]);

  function handleSearchChange(event) {
    setSearchInput(event.target.value);
    setPage(1);
  }

  function handleSort(key) {
    setSortDirection((currentDirection) => nextDirection(sortBy, currentDirection, key));
    setSortBy(key);
    setPage(1);
  }

  function handleRetry() {
    setRetryCount((count) => count + 1);
  }

  const isLoading = status === 'loading';
  const isError = status === 'error';
  const hasCustomers = customers.length > 0;
  const hasSearch = search.length > 0;
  const currentPage = pagination.page || page;
  const totalPages = pagination.totalPages || 0;
  const pageLabelTotal = Math.max(totalPages, 1);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="mt-2 text-gray-600">Search, sort, and page through customer records.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="customer-search">
          Search customers
        </label>
        <input
          id="customer-search"
          className="mt-1 w-full max-w-md rounded border border-gray-300 px-3 py-2 shadow-sm"
          type="search"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by name or email"
        />
      </div>

      {isError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
          <p>{error}</p>
          <button className="mt-3 rounded bg-red-700 px-3 py-2 text-white" type="button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Customer list</caption>
          <thead className="bg-gray-100">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                  scope="col"
                  aria-sort={sortBy === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    className="inline-flex items-center gap-1 hover:text-blue-700"
                    type="button"
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label}
                    <span aria-hidden="true">{sortBy === column.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={COLUMNS.length}>
                  Loading customers…
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError && !hasCustomers ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={COLUMNS.length}>
                  {hasSearch ? 'No matching customers.' : 'No customers yet.'}
                </td>
              </tr>
            ) : null}

            {!isLoading && hasCustomers
              ? customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{customer.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{customer.company}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {formatStatus(customer.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Page {currentPage} of {pageLabelTotal} • {pagination.total} customers
        </p>
        <div className="flex gap-2">
          <button
            className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isLoading || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <button
            className="rounded border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isLoading || totalPages === 0 || page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
