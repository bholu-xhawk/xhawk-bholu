import React, { useEffect, useMemo, useRef, useState } from 'react';

const SORT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Signed up' },
];

const DEFAULT_PAGINATION = { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function buildCustomersUrl({ search, sortBy, sortOrder, page }) {
  const params = new URLSearchParams({ sortBy, sortOrder, page: String(page) });
  if (search) params.set('search', search);
  return `/api/customers?${params.toString()}`;
}

function buildHeaders() {
  const headers = { Accept: 'application/json' };
  const token = window.localStorage.getItem('authToken') || window.localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Customers() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [retryNonce, setRetryNonce] = useState(0);
  const latestRequest = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    const controller = new AbortController();

    async function loadCustomers() {
      setStatus('loading');
      setError('');

      try {
        const response = await fetch(buildCustomersUrl({ search: debouncedSearch, sortBy, sortOrder, page }), {
          headers: buildHeaders(),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load customers.');
        }

        const body = await response.json();
        if (latestRequest.current !== requestId) return;

        setCustomers(body.data || []);
        setPagination(body.pagination || DEFAULT_PAGINATION);
        setStatus('success');
      } catch (err) {
        if (err.name === 'AbortError' || latestRequest.current !== requestId) return;
        setCustomers([]);
        setPagination(DEFAULT_PAGINATION);
        setError('Unable to load customers. Please try again.');
        setStatus('error');
      }
    }

    loadCustomers();

    return () => controller.abort();
  }, [debouncedSearch, sortBy, sortOrder, page, retryNonce]);

  const showingRange = useMemo(() => {
    if (pagination.totalItems === 0) return 'Showing 0 customers';
    const start = (pagination.page - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);
    return `Showing ${start}-${end} of ${pagination.totalItems} customers`;
  }, [pagination]);

  function updateSort(nextSortBy) {
    setPage(1);
    if (sortBy === nextSortBy) {
      setSortOrder((currentSortOrder) => (currentSortOrder === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortOrder('asc');
  }

  function retry() {
    setRetryNonce((value) => value + 1);
  }

  const isLoading = status === 'loading';
  const isError = status === 'error';
  const isEmpty = status === 'success' && customers.length === 0;
  const hasSearch = debouncedSearch.length > 0;
  const canGoPrevious = !isLoading && pagination.page > 1;
  const canGoNext = !isLoading && pagination.totalPages > 0 && pagination.page < pagination.totalPages;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Customer directory</p>
        <h1 className="text-3xl font-bold text-gray-950">Customers</h1>
        <p className="mt-2 text-gray-600">Search, sort, and page through customer records from the server.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700">
          Search customers
        </label>
        <input
          id="customer-search"
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or email"
        />
      </div>

      {isLoading && (
        <div role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
          Loading customers…
        </div>
      )}

      {isError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
          <p>{error}</p>
          <button className="mt-3 rounded-md bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800" type="button" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {!isError && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="sr-only">Customers</caption>
            <thead className="bg-gray-50">
              <tr>
                {SORT_FIELDS.map((field) => {
                  const active = sortBy === field.key;
                  return (
                    <th
                      key={field.key}
                      scope="col"
                      aria-sort={active ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                    >
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded text-left hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => updateSort(field.key)}
                      >
                        <span>{field.label}</span>
                        <span aria-hidden="true">{active ? (sortOrder === 'asc' ? '↑' : '↓') : '↕'}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-gray-950">{customer.name}</td>
                  <td className="px-4 py-3 text-gray-700">{customer.email}</td>
                  <td className="px-4 py-3 text-gray-700">{customer.company}</td>
                  <td className="px-4 py-3 text-gray-700">{customer.status}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(customer.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {isEmpty && (
            <div className="border-t border-gray-200 p-8 text-center text-gray-600">
              {hasSearch ? 'No customers match your search.' : 'No customers have been added yet.'}
            </div>
          )}
        </div>
      )}

      {!isError && (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p>{showingRange}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-gray-300 px-4 py-2 font-medium enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canGoPrevious}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span aria-live="polite">
              Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
            </span>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-4 py-2 font-medium enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canGoNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
