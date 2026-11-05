import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SORT_OPTIONS = ['name', 'email', 'company', 'status', 'signedUpAt'];
const SORT_LABELS = {
  name: 'Name',
  email: 'Email',
  company: 'Company',
  status: 'Status',
  signedUpAt: 'Signed up',
};
const DEFAULT_SORT = 'name';
const DEFAULT_DIRECTION = 'asc';

function normalizeSort(value) {
  return SORT_OPTIONS.includes(value) ? value : DEFAULT_SORT;
}

function normalizeDirection(value) {
  return value === 'desc' ? 'desc' : DEFAULT_DIRECTION;
}

function normalizePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function buildParams({ search, sortBy, sortDirection, page }) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('sortBy', sortBy);
  params.set('sortDirection', sortDirection);
  params.set('page', String(page));
  return params;
}

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search')?.trim() || '';
  const sortBy = normalizeSort(searchParams.get('sortBy'));
  const sortDirection = normalizeDirection(searchParams.get('sortDirection'));
  const page = normalizePage(searchParams.get('page'));

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page, pageSize: 20, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const nextSearch = searchInput.trim();
    if (nextSearch === urlSearch) return undefined;

    const timeout = setTimeout(() => {
      setSearchParams(buildParams({ search: nextSearch, sortBy, sortDirection, page: 1 }));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput, urlSearch, sortBy, sortDirection, setSearchParams]);

  const requestParams = useMemo(
    () => buildParams({ search: urlSearch, sortBy, sortDirection, page }),
    [urlSearch, sortBy, sortDirection, page]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetch(`/api/customers?${requestParams.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load customers.');
        }
        return response.json();
      })
      .then((data) => {
        setCustomers(data.customers || []);
        setPagination(data.pagination || { page, pageSize: 20, totalItems: 0, totalPages: 0 });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setCustomers([]);
        setError('Unable to load customers. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [requestParams, retryKey, page]);

  function updateUrl(updates) {
    const next = buildParams({ search: urlSearch, sortBy, sortDirection, page, ...updates });
    setSearchParams(next);
  }

  function changeSort(field) {
    const nextDirection = sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc';
    updateUrl({ sortBy: field, sortDirection: nextDirection, page: 1 });
  }

  const firstItem = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);
  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < pagination.totalPages && !loading;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="mt-2 text-gray-600">Search, sort, and page through CRM customer records.</p>
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <label className="block text-sm font-medium text-gray-700" htmlFor="customer-search">
          Search customers
        </label>
        <input
          id="customer-search"
          className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or email"
        />
      </div>

      {loading && <p role="status">Loading customers...</p>}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800" role="alert">
          <p>{error}</p>
          <button className="mt-3 rounded bg-red-700 px-3 py-2 text-white" type="button" onClick={() => setRetryKey((key) => key + 1)}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && customers.length === 0 && (
        <div className="rounded border border-dashed border-gray-300 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">No customers found</h2>
          <p className="mt-2 text-gray-600">Try a different search term.</p>
        </div>
      )}

      {!error && customers.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 p-4 text-sm text-gray-600">
            Showing {firstItem}-{lastItem} of {pagination.totalItems} customers
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {SORT_OPTIONS.map((field) => (
                    <th
                      aria-sort={sortBy === field ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-700"
                      key={field}
                      scope="col"
                    >
                      <button className="inline-flex items-center gap-1 hover:underline" type="button" onClick={() => changeSort(field)}>
                        {SORT_LABELS[field]}
                        {sortBy === field ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-3 font-medium">{customer.name}</td>
                    <td className="px-4 py-3">{customer.email}</td>
                    <td className="px-4 py-3">{customer.company}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold capitalize text-blue-800">
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(customer.signedUpAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow">
        <button
          className="rounded bg-gray-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!canGoPrevious}
          type="button"
          onClick={() => updateUrl({ page: page - 1 })}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages || 1}
        </span>
        <button
          className="rounded bg-gray-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          disabled={!canGoNext}
          type="button"
          onClick={() => updateUrl({ page: page + 1 })}
        >
          Next
        </button>
      </div>
    </section>
  );
}
