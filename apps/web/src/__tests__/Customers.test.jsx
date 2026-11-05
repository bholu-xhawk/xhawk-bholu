import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Customers from '../pages/Customers.jsx';

function makeCustomer(overrides = {}) {
  return {
    id: 1,
    name: 'Alice Adams',
    email: 'alice@example.com',
    company: 'Acme Co',
    status: 'active',
    signedUpAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function payload(customers = [makeCustomer()], pagination = {}) {
  return {
    customers,
    pagination: {
      page: 1,
      pageSize: 20,
      totalItems: customers.length,
      totalPages: customers.length ? 1 : 0,
      ...pagination,
    },
  };
}

function okResponse(body) {
  return Promise.resolve({ ok: true, json: async () => body });
}

function deferredResponse(body) {
  let resolve;
  const promise = new Promise((done) => {
    resolve = () => done({ ok: true, json: async () => body });
  });
  return { promise, resolve };
}

function LocationProbe() {
  const location = useLocation();
  return <div aria-label="current query">{location.search}</div>;
}

function renderCustomers(initialEntry = '/customers') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/customers"
          element={
            <>
              <LocationProbe />
              <Customers />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('Customers page', () => {
  beforeEach(() => {
    jest.useRealTimers();
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('shows initial loading state and then renders server rows', async () => {
    const first = deferredResponse(payload([makeCustomer()]));
    globalThis.fetch.mockReturnValueOnce(first.promise);

    renderCustomers();

    expect(screen.getByRole('status')).toHaveTextContent('Loading customers');
    first.resolve();

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-1 of 1 customers')).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers?sortBy=name&sortDirection=asc&page=1', expect.any(Object));
  });

  it('debounces server search, updates the URL, and aborts the superseded request', async () => {
    jest.useFakeTimers();
    const initial = deferredResponse(payload([makeCustomer()]));
    globalThis.fetch
      .mockReturnValueOnce(initial.promise)
      .mockReturnValueOnce(okResponse(payload([makeCustomer({ name: 'Bob Search', email: 'bob@example.com' })])));

    renderCustomers();

    fireEvent.change(screen.getByLabelText(/search customers/i), { target: { value: 'bob' } });
    act(() => jest.advanceTimersByTime(299));
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(1));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
    expect(globalThis.fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(globalThis.fetch.mock.calls[1][0]).toBe('/api/customers?search=bob&sortBy=name&sortDirection=asc&page=1');
    expect(await screen.findByText('Bob Search')).toBeInTheDocument();
    expect(screen.getByLabelText('current query')).toHaveTextContent('?search=bob&sortBy=name&sortDirection=asc&page=1');
  });

  it('changes sort URL/request state and exposes the active sort direction', async () => {
    globalThis.fetch
      .mockReturnValueOnce(okResponse(payload([makeCustomer()])))
      .mockReturnValueOnce(okResponse(payload([makeCustomer({ email: 'zara@example.com' })])));

    renderCustomers();

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: /email/i }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
    expect(globalThis.fetch.mock.calls[1][0]).toBe('/api/customers?sortBy=email&sortDirection=asc&page=1');
    expect(screen.getByRole('columnheader', { name: /email/i })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByLabelText('current query')).toHaveTextContent('?sortBy=email&sortDirection=asc&page=1');
  });

  it('requests the next and previous pages and disables pagination at bounds', async () => {
    globalThis.fetch
      .mockReturnValueOnce(okResponse(payload([makeCustomer({ id: 1, name: 'Page One' })], { page: 1, totalItems: 21, totalPages: 2 })))
      .mockReturnValueOnce(okResponse(payload([makeCustomer({ id: 21, name: 'Page Two' })], { page: 2, totalItems: 21, totalPages: 2 })))
      .mockReturnValueOnce(okResponse(payload([makeCustomer({ id: 1, name: 'Page One' })], { page: 1, totalItems: 21, totalPages: 2 })));

    renderCustomers();

    expect(await screen.findByText('Page One')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText('Page Two');
    expect(globalThis.fetch.mock.calls[1][0]).toBe('/api/customers?sortBy=name&sortDirection=asc&page=2');
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    await screen.findByText('Page One');
    expect(globalThis.fetch.mock.calls[2][0]).toBe('/api/customers?sortBy=name&sortDirection=asc&page=1');
  });

  it('renders an empty state for zero server results', async () => {
    globalThis.fetch.mockReturnValueOnce(okResponse(payload([], { totalItems: 0, totalPages: 0 })));

    renderCustomers('/customers?search=nomatch');

    expect(await screen.findByRole('heading', { name: /no customers found/i })).toBeInTheDocument();
    expect(screen.getByText(/try a different search term/i)).toBeInTheDocument();
  });

  it('renders an error state and retries the failed request', async () => {
    globalThis.fetch
      .mockRejectedValueOnce(new Error('network failed'))
      .mockReturnValueOnce(okResponse(payload([makeCustomer({ name: 'Recovered Customer' })])));

    renderCustomers();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load customers');
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Recovered Customer')).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('toggles the active sort direction when the same heading is selected', async () => {
    globalThis.fetch
      .mockReturnValueOnce(okResponse(payload([makeCustomer()])))
      .mockReturnValueOnce(okResponse(payload([makeCustomer({ name: 'Zed Zebra' })])));

    renderCustomers();

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /name/i }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(2));
    expect(globalThis.fetch.mock.calls[1][0]).toBe('/api/customers?sortBy=name&sortDirection=desc&page=1');
    expect(screen.getByRole('columnheader', { name: /name/i })).toHaveAttribute('aria-sort', 'descending');
  });
});
