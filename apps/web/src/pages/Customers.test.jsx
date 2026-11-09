import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Customers from './Customers.jsx';
import { listCustomers } from '../api/customers.js';

jest.mock('../api/customers.js', () => ({
  listCustomers: jest.fn(),
}));

function customer(overrides = {}) {
  return {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    company: 'Analytical Engines',
    status: 'active_customer',
    createdAt: '2025-03-08T12:00:00.000Z',
    ...overrides,
  };
}

function response(customers = [customer()], pagination = {}) {
  return {
    customers,
    pagination: {
      page: 1,
      pageSize: 20,
      total: customers.length,
      totalPages: customers.length ? 1 : 0,
      ...pagination,
    },
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

describe('Customers page', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders loading, customer data, formatted status, and signed-up date', async () => {
    const request = deferred();
    listCustomers.mockReturnValueOnce(request.promise);

    render(<Customers />);

    expect(screen.getByText('Loading customers…')).toBeInTheDocument();

    await act(async () => {
      request.resolve(response());
    });

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
    expect(screen.getByText('Analytical Engines')).toBeInTheDocument();
    expect(screen.getByText('Active Customer')).toBeInTheDocument();
    expect(screen.getByText('Mar 8, 2025')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1 • 1 customers')).toBeInTheDocument();
  });

  it('debounces server search', async () => {
    jest.useFakeTimers();
    listCustomers.mockResolvedValue(response([customer()], { page: 1, total: 25, totalPages: 2 }));

    render(<Customers />);
    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText(/search customers/i), { target: { value: 'needle' } });

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(listCustomers).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(2));
    expect(listCustomers).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'needle', page: 1, sortBy: 'createdAt', sortDirection: 'desc' })
    );
  });

  it('sends sort transitions for every sortable column', async () => {
    listCustomers.mockResolvedValue(response());

    render(<Customers />);
    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(1));

    const expectedTransitions = [
      [/name/i, { sortBy: 'name', sortDirection: 'asc' }],
      [/name/i, { sortBy: 'name', sortDirection: 'desc' }],
      [/email/i, { sortBy: 'email', sortDirection: 'asc' }],
      [/company/i, { sortBy: 'company', sortDirection: 'asc' }],
      [/status/i, { sortBy: 'status', sortDirection: 'asc' }],
      [/signed up/i, { sortBy: 'createdAt', sortDirection: 'desc' }],
    ];

    for (const [name, expected] of expectedTransitions) {
      fireEvent.click(screen.getByRole('button', { name }));
      await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining(expected)));
      expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    }

    expect(within(screen.getByRole('columnheader', { name: /signed up/i })).getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /signed up/i })).toHaveAttribute('aria-sort', 'descending');
  });

  it('pages forward and backward with disabled boundary actions', async () => {
    listCustomers.mockResolvedValue(response([customer()], { page: 1, total: 21, totalPages: 2 }));

    render(<Customers />);
    await waitFor(() => expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled());

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));

    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
  });

  it('resets to page one when search changes', async () => {
    listCustomers.mockResolvedValue(response([customer()], { page: 1, total: 21, totalPages: 2 }));

    render(<Customers />);
    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));

    fireEvent.change(screen.getByLabelText(/search customers/i), { target: { value: 'needle' } });
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
  });

  it('keeps the newest result when stale requests resolve later', async () => {
    const first = deferred();
    const second = deferred();
    listCustomers.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<Customers />);
    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /name/i }));
    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(2));

    await act(async () => {
      second.resolve(response([customer({ id: 2, name: 'Newest Result', email: 'new@example.com' })]));
    });

    expect(await screen.findByText('Newest Result')).toBeInTheDocument();

    await act(async () => {
      first.resolve(response([customer({ id: 1, name: 'Stale Result', email: 'old@example.com' })]));
    });

    expect(screen.getByText('Newest Result')).toBeInTheDocument();
    expect(screen.queryByText('Stale Result')).not.toBeInTheDocument();
  });

  it('distinguishes no customers from no matching customers', async () => {
    jest.useFakeTimers();
    listCustomers.mockResolvedValue(response([]));

    render(<Customers />);

    expect(await screen.findByText('No customers yet.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/search customers/i), { target: { value: 'missing' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('No matching customers.')).toBeInTheDocument();
  });

  it('shows API errors and retries the request', async () => {
    listCustomers
      .mockRejectedValueOnce(new Error('API unavailable'))
      .mockResolvedValueOnce(response([customer({ name: 'Recovered Customer' })]));

    render(<Customers />);

    expect(await screen.findByRole('alert')).toHaveTextContent('API unavailable');

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Recovered Customer')).toBeInTheDocument();
    expect(listCustomers).toHaveBeenCalledTimes(2);
  });
});
