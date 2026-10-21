import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Home from './Home.jsx';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { apiRequest } from '../lib/api.js';

jest.mock('../lib/api.js', () => ({
  apiRequest: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

function renderHome() {
  window.localStorage.setItem('todo_jwt', 'jwt-token');
  return render(
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}

function todo(overrides = {}) {
  return {
    id: 1,
    title: 'Write tests',
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: '2026-10-30',
    ...overrides,
  };
}

describe('Home todo workspace', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.localStorage.clear();
    apiRequest.mockResolvedValue({ items: [todo()], total: 1, page: 1, page_size: 10 });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders loading, empty, and error states', async () => {
    apiRequest.mockReturnValueOnce(new Promise(() => {}));
    const { unmount } = renderHome();
    expect(screen.getByRole('status')).toHaveTextContent(/loading todos/i);
    unmount();

    apiRequest.mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 10 });
    renderHome();
    expect(await screen.findByText(/no todos match/i)).toBeInTheDocument();

    apiRequest.mockRejectedValueOnce(new Error('Boom'));
    renderHome();
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('sends server query parameters for pagination, filters, search, and sort', async () => {
    apiRequest.mockResolvedValue({ items: [todo()], total: 30, page: 1, page_size: 10 });
    renderHome();
    await screen.findByText('Write tests');

    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: 'done' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'high' } });
    fireEvent.change(screen.getByLabelText(/search titles/i), { target: { value: 'invoice' } });
    fireEvent.change(screen.getByLabelText(/sort/i), { target: { value: 'due_date:asc' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(apiRequest.mock.calls.at(-1)[0]).toContain('search=invoice');
    });

    const lastPath = apiRequest.mock.calls.at(-1)[0];
    expect(lastPath).toContain('page=1');
    expect(lastPath).toContain('page_size=10');
    expect(lastPath).toContain('status=done');
    expect(lastPath).toContain('priority=high');
    expect(lastPath).toContain('search=invoice');
    expect(lastPath).toContain('sort_by=due_date');
    expect(lastPath).toContain('sort_order=asc');

    apiRequest.mockResolvedValueOnce({ items: [todo({ id: 2, title: 'Next page' })], total: 30, page: 2, page_size: 10 });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(apiRequest.mock.calls.at(-1)[0]).toContain('page=2'));
  });

  it('uses pagination metadata to enable and disable pager controls', async () => {
    apiRequest.mockResolvedValueOnce({ items: [todo()], total: 11, page: 1, page_size: 10 });
    renderHome();
    expect(await screen.findByText(/page 1 of 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('creates and edits todos in a modal, then refreshes the active page', async () => {
    apiRequest.mockResolvedValue({ items: [todo()], total: 1, page: 1, page_size: 10 });
    renderHome();
    await screen.findByText('Write tests');

    fireEvent.click(screen.getByRole('button', { name: /new todo/i }));
    const createDialog = screen.getByRole('dialog', { name: /create todo/i });
    fireEvent.change(within(createDialog).getByLabelText(/^title$/i), { target: { value: 'Created todo' } });
    fireEvent.change(within(createDialog).getByLabelText(/priority/i), { target: { value: 'high' } });
    fireEvent.click(within(createDialog).getByRole('button', { name: /save todo/i }));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/todos', expect.objectContaining({ method: 'POST' })));
    await waitFor(() => expect(apiRequest.mock.calls.filter(([path]) => path.startsWith('/todos?')).length).toBeGreaterThan(1));

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const editDialog = screen.getByRole('dialog', { name: /edit todo/i });
    fireEvent.change(within(editDialog).getByLabelText(/^title$/i), { target: { value: 'Edited todo' } });
    fireEvent.click(within(editDialog).getByRole('button', { name: /save todo/i }));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/todos/1', expect.objectContaining({ method: 'PUT' })));
  });

  it('requires explicit confirmation before deleting a todo and refreshes afterward', async () => {
    renderHome();
    await screen.findByText('Write tests');

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    const dialog = screen.getByRole('dialog', { name: /delete todo/i });
    expect(within(dialog).getByText(/this action cannot be undone/i)).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalledWith('/todos/1', expect.objectContaining({ method: 'DELETE' }));

    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/todos/1', expect.objectContaining({ method: 'DELETE' })));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /delete todo/i })).not.toBeInTheDocument());
  });
});
