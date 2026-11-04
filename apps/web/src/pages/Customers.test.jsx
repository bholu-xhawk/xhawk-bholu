import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Customers from './Customers.jsx';

function makeCustomer(overrides = {}) {
  return {
    id: 1,
    name: 'Ava Stone',
    email: 'ava@example.com',
    company: 'Acme Co',
    status: 'active',
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  };
}

function response(body, ok = true) {
  return { ok, json: jest.fn().mockResolvedValue(body) };
}

function successfulBody(overrides = {}) {
  const data = overrides.data ?? [makeCustomer()];
  return {
    data,
    pagination: { page: 1, pageSize: 20, totalItems: data.length, totalPages: data.length ? 1 : 0, ...(overrides.pagination || {}) },
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.useFakeTimers();
  window.localStorage.clear();
  globalThis.fetch = jest.fn();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Customers', () => {
  it('shows loading and then renders fetched customers with pagination', async () => {
    const request = deferred();
    globalThis.fetch.mockReturnValueOnce(request.promise);

    render(<Customers />);

    expect(screen.getByRole('status')).toHaveTextContent(/Loading customers/i);
    request.resolve(response(successfulBody({ data: [makeCustomer({ name: 'Ava Stone', email: 'ava@example.com' })] })));

    expect(await screen.findByRole('cell', { name: 'Ava Stone' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ava@example.com' })).toBeInTheDocument();
    expect(screen.getByText(/Showing 1-1 of 1 customers/i)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers?sortBy=name&sortOrder=asc&page=1', expect.objectContaining({ headers: { Accept: 'application/json' } }));
  });

  it('adds an authorization header when a bearer token exists', async () => {
    window.localStorage.setItem('authToken', 'abc123');
    globalThis.fetch.mockResolvedValueOnce(response(successfulBody()));

    render(<Customers />);

    await screen.findByRole('cell', { name: 'Ava Stone' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/customers?sortBy=name&sortOrder=asc&page=1',
      expect.objectContaining({ headers: { Accept: 'application/json', Authorization: 'Bearer abc123' } })
    );
  });

  it('debounces server search, resets to page one, and reports no search results', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(response(successfulBody({ data: Array.from({ length: 20 }, (_, index) => makeCustomer({ id: index + 1, name: `Customer ${index + 1}` })), pagination: { page: 1, totalItems: 30, totalPages: 2 } })))
      .mockResolvedValueOnce(response(successfulBody({ data: [makeCustomer({ id: 21, name: 'Customer 21' })], pagination: { page: 2, totalItems: 30, totalPages: 2 } })));

    render(<Customers />);
    await screen.findByRole('cell', { name: 'Customer 1' });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenLastCalledWith(expect.stringContaining('page=2'), expect.any(Object)));

    globalThis.fetch.mockResolvedValueOnce(response(successfulBody({ data: [], pagination: { page: 1, totalItems: 0, totalPages: 0 } })));
    fireEvent.change(screen.getByLabelText(/Search customers/i), { target: { value: '  missing@example.com  ' } });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenLastCalledWith(expect.stringContaining('search=missing%40example.com'), expect.any(Object)));
    expect(globalThis.fetch).toHaveBeenLastCalledWith(expect.stringContaining('page=1'), expect.any(Object));
    expect(await screen.findByText(/No customers match your search/i)).toBeInTheDocument();
  });

  it('requests ascending and descending sort and exposes accessible sort state', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(response(successfulBody()))
      .mockResolvedValueOnce(response(successfulBody({ data: [makeCustomer({ company: 'Beta LLC' })] })))
      .mockResolvedValueOnce(response(successfulBody({ data: [makeCustomer({ company: 'Zeta LLC' })] })));

    render(<Customers />);
    await screen.findByRole('cell', { name: 'Ava Stone' });

    fireEvent.click(screen.getByRole('button', { name: /Company/i }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenLastCalledWith('/api/customers?sortBy=company&sortOrder=asc&page=1', expect.any(Object)));
    expect(screen.getByRole('columnheader', { name: /Company/i })).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: /Company/i }));
    await waitFor(() => expect(globalThis.fetch).toHaveBeenLastCalledWith('/api/customers?sortBy=company&sortOrder=desc&page=1', expect.any(Object)));
    expect(screen.getByRole('columnheader', { name: /Company/i })).toHaveAttribute('aria-sort', 'descending');
  });

  it('requests next and previous pages and disables controls at page boundaries', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(response(successfulBody({ data: [makeCustomer({ id: 1, name: 'Page One' })], pagination: { page: 1, totalItems: 25, totalPages: 2 } })))
      .mockResolvedValueOnce(response(successfulBody({ data: [makeCustomer({ id: 21, name: 'Page Two' })], pagination: { page: 2, totalItems: 25, totalPages: 2 } })))
      .mockResolvedValueOnce(response(successfulBody({ data: [makeCustomer({ id: 1, name: 'Page One' })], pagination: { page: 1, totalItems: 25, totalPages: 2 } })));

    render(<Customers />);
    await screen.findByRole('cell', { name: 'Page One' });

    const previous = screen.getByRole('button', { name: /Previous/i });
    const next = screen.getByRole('button', { name: /Next/i });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(next);
    await screen.findByRole('cell', { name: 'Page Two' });
    expect(globalThis.fetch).toHaveBeenLastCalledWith('/api/customers?sortBy=name&sortOrder=asc&page=2', expect.any(Object));
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();

    fireEvent.click(previous);
    await screen.findByRole('cell', { name: 'Page One' });
    expect(globalThis.fetch).toHaveBeenLastCalledWith('/api/customers?sortBy=name&sortOrder=asc&page=1', expect.any(Object));
  });

  it('distinguishes an empty directory from no search results', async () => {
    globalThis.fetch.mockResolvedValueOnce(response(successfulBody({ data: [], pagination: { page: 1, totalItems: 0, totalPages: 0 } })));

    render(<Customers />);

    expect(await screen.findByText(/No customers have been added yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
  });

  it('shows an API error and retries the request', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(response({ error: 'Nope' }, false))
      .mockResolvedValueOnce(response(successfulBody({ data: [makeCustomer({ name: 'Recovered Customer' })] })));

    render(<Customers />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load customers/i);
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: /Retry/i }));

    expect(await screen.findByRole('cell', { name: 'Recovered Customer' })).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('prevents stale responses from overwriting the current results', async () => {
    const first = deferred();
    const second = deferred();
    globalThis.fetch.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<Customers />);
    fireEvent.click(screen.getByRole('button', { name: /Email/i }));

    second.resolve(response(successfulBody({ data: [makeCustomer({ id: 2, name: 'Fresh Result', email: 'fresh@example.com' })] })));
    expect(await screen.findByRole('cell', { name: 'Fresh Result' })).toBeInTheDocument();

    first.resolve(response(successfulBody({ data: [makeCustomer({ id: 1, name: 'Stale Result', email: 'stale@example.com' })] })));
    await waitFor(() => expect(screen.queryByRole('cell', { name: 'Stale Result' })).not.toBeInTheDocument());
  });
});
