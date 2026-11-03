import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Todos from './Todos.jsx';
import { TOKEN_STORAGE_KEY } from '../lib/api.js';

function response(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  });
}

const firstTodo = { id: 1, title: 'Write tests', completed: false, userId: 1, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
const secondTodo = { id: 2, title: 'Ship feature', completed: false, userId: 1, createdAt: '2026-01-02', updatedAt: '2026-01-02' };

function renderTodos(onUnauthorized = jest.fn()) {
  return render(<Todos token="token-123" onUnauthorized={onUnauthorized} />);
}

describe('Todos', () => {
  beforeEach(() => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'token-123');
    globalThis.fetch = jest.fn();
  });

  it('shows loading and then the empty state', async () => {
    globalThis.fetch.mockReturnValueOnce(response([]));

    renderTodos();

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument();
    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('shows load errors', async () => {
    globalThis.fetch.mockReturnValueOnce(response({ error: 'Database unavailable' }, 500));

    renderTodos();

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });

  it('creates a todo from the server response', async () => {
    globalThis.fetch
      .mockReturnValueOnce(response([]))
      .mockReturnValueOnce(response(firstTodo, 201));

    renderTodos();
    await screen.findByText(/no todos yet/i);

    fireEvent.change(screen.getByLabelText(/new todo/i), { target: { value: '  Write tests  ' } });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));

    expect(await screen.findByText('Write tests')).toBeInTheDocument();
    expect(screen.getByLabelText(/new todo/i)).toHaveValue('');
    expect(JSON.parse(globalThis.fetch.mock.calls[1][1].body)).toEqual({ title: 'Write tests' });
  });

  it('toggles a single todo completion only after a successful response', async () => {
    globalThis.fetch
      .mockReturnValueOnce(response([firstTodo]))
      .mockReturnValueOnce(response({ ...firstTodo, completed: true }));

    renderTodos();

    const checkbox = await screen.findByLabelText(/mark write tests complete/i);
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);

    await waitFor(() => expect(screen.getByLabelText(/mark write tests incomplete/i)).toBeChecked());
  });

  it('saves and cancels inline edits', async () => {
    globalThis.fetch
      .mockReturnValueOnce(response([firstTodo]))
      .mockReturnValueOnce(response({ ...firstTodo, title: 'Review tests' }));

    renderTodos();
    await screen.findByText('Write tests');

    fireEvent.click(screen.getByRole('button', { name: /edit write tests/i }));
    fireEvent.change(screen.getByLabelText(/edit title for write tests/i), { target: { value: ' Review tests ' } });
    fireEvent.click(screen.getByRole('button', { name: /save title/i }));

    expect(await screen.findByText('Review tests')).toBeInTheDocument();
    expect(JSON.parse(globalThis.fetch.mock.calls[1][1].body)).toEqual({ title: 'Review tests' });

    fireEvent.click(screen.getByRole('button', { name: /edit review tests/i }));
    fireEvent.change(screen.getByLabelText(/edit title for review tests/i), { target: { value: 'Do not keep this' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel edit/i }));

    expect(screen.getByText('Review tests')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Do not keep this')).not.toBeInTheDocument();
  });

  it('marks all unfinished todos done from the server response', async () => {
    globalThis.fetch
      .mockReturnValueOnce(response([firstTodo, secondTodo]))
      .mockReturnValueOnce(response([
        { ...firstTodo, completed: true },
        { ...secondTodo, completed: true },
      ]));

    renderTodos();
    await screen.findByText('Write tests');

    fireEvent.click(screen.getByRole('button', { name: /mark all done/i }));

    await waitFor(() => expect(screen.getByText(/all caught up/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/mark write tests incomplete/i)).toBeChecked();
    expect(screen.getByLabelText(/mark ship feature incomplete/i)).toBeChecked();
  });

  it('keeps confirmed UI state when a mutation fails', async () => {
    globalThis.fetch
      .mockReturnValueOnce(response([firstTodo]))
      .mockReturnValueOnce(response({ error: 'Could not update todo' }, 500));

    renderTodos();

    const item = await screen.findByText('Write tests');
    const checkbox = within(item.closest('li')).getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update todo');
    expect(screen.getByLabelText(/mark write tests complete/i)).not.toBeChecked();
  });

  it('clears the stored token and notifies the app on 401', async () => {
    const onUnauthorized = jest.fn();
    globalThis.fetch.mockReturnValueOnce(response({ error: 'Invalid or expired token' }, 401));

    renderTodos(onUnauthorized);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
