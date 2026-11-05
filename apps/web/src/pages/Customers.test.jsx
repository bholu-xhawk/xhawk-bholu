import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Customers from './Customers.jsx';
import { listCustomers } from '../api/customers.js';

jest.mock('../api/customers.js', () => ({
  listCustomers: jest.fn(),
}));

const envelope = (items = [], overrides = {}) => ({
  items,
  page: 1,
  pageSize: 20,
  total: items.length,
  totalPages: items.length ? 1 : 0,
  ...overrides,
});

const customer = (overrides = {}) => ({
  id: 1,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  status: 'active',
  signedUpAt: '2024-01-15T00:00:00.000Z',
  ...overrides,
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Customers page', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    listCustomers.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('shows loading, renders rows, status, and formatted date', async () => {
    const request = deferred();
    listCustomers.mockReturnValueOnce(request.promise);

    render(<Customers />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading customers');
    expect(listCustomers).toHaveBeenCalledWith(expect.objectContaining({ search: '', sort: 'signedUpAt', direction: 'desc', page: 1 }));

    await act(async () => {
      request.resolve(envelope([customer()]));
    });

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 1 · 1 customers/)).toBeInTheDocument();
  });

  it('debounces search and sends trimmed server search parameters', async () => {
    listCustomers.mockResolvedValue(envelope());
    render(<Customers />);
    await screen.findByText('No customers yet.');

    fireEvent.change(screen.getByLabelText(/Search customers/i), { target: { value: '  ada@example  ' } });

    expect(listCustomers).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(listCustomers).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1);
    });

    await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(2));
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'ada@example', page: 1 }));
  });

  it('toggles sorting and resets to page one', async () => {
    listCustomers.mockResolvedValue(envelope([customer()], { total: 40, totalPages: 2 }));
    render(<Customers />);
    await screen.findByText('Ada Lovelace');

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));

    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'name', direction: 'asc', page: 1 })));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    await waitFor(() => expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'name', direction: 'desc', page: 1 })));
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'descending');
  });

  it('navigates pages and disables impossible pagination actions', async () => {
    listCustomers.mockResolvedValue(envelope([customer()], { page: 1, total: 25, totalPages: 2 }));
    render(<Customers />);
    await screen.findByText('Ada Lovelace');

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();

    listCustomers.mockResolvedValue(envelope([customer({ id: 2, name: 'Grace Hopper' })], { page: 2, total: 25, totalPages: 2 }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    await screen.findByText('Grace Hopper');
    expect(listCustomers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('distinguishes empty database from no matching search results', async () => {
    listCustomers.mockResolvedValue(envelope());
    render(<Customers />);
    expect(await screen.findByText('No customers yet.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Search customers/i), { target: { value: 'missing' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(await screen.findByText('No customers match your search.')).toBeInTheDocument();
  });

  it('ignores stale responses from earlier requests', async () => {
    const first = deferred();
    const second = deferred();
    listCustomers.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<Customers />);
    fireEvent.change(screen.getByLabelText(/Search customers/i), { target: { value: 'new' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {
      second.resolve(envelope([customer({ id: 2, name: 'New Result' })]));
    });
    expect(screen.getByText('New Result')).toBeInTheDocument();

    await act(async () => {
      first.resolve(envelope([customer({ id: 1, name: 'Old Result' })]));
    });
    expect(screen.queryByText('Old Result')).not.toBeInTheDocument();
  });

  it('shows retryable errors and reloads current query', async () => {
    listCustomers.mockRejectedValueOnce(new Error('API unavailable')).mockResolvedValueOnce(envelope([customer()]));

    render(<Customers />);
    expect(await screen.findByRole('alert')).toHaveTextContent('API unavailable');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(listCustomers).toHaveBeenCalledTimes(2);
  });
});
