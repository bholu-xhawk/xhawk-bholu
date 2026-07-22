import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import TodoList from './TodoList.jsx';

const initialTodos = [
  { id: 1, title: 'Buy milk', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  { id: 2, title: 'Walk dog', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
  { id: 3, title: 'Read book', createdAt: '2024-01-03T00:00:00.000Z', updatedAt: '2024-01-03T00:00:00.000Z' },
];

function mockJsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockEmptyResponse(status = 204) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(null),
  });
}

describe('TodoList', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => mockJsonResponse(initialTodos));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches and displays todos', async () => {
    render(<TodoList />);

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Walk dog')).toBeInTheDocument();
    expect(screen.getByText('Read book')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/todos', undefined);
  });

  it('posts a new todo from the form', async () => {
    global.fetch
      .mockImplementationOnce(() => mockJsonResponse([]))
      .mockImplementationOnce(() => mockJsonResponse({ id: 4, title: 'Write tests', createdAt: 'now', updatedAt: 'now' }, 201));

    render(<TodoList />);

    await screen.findByText('No todos yet.');
    fireEvent.change(screen.getByLabelText('Todo title'), { target: { value: '  Write tests  ' } });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));

    expect(await screen.findByText('Write tests')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests' }),
    });
  });

  it('deletes one todo with its row button', async () => {
    global.fetch
      .mockImplementationOnce(() => mockJsonResponse(initialTodos))
      .mockImplementationOnce(() => mockEmptyResponse());

    render(<TodoList />);

    const todo = await screen.findByText('Buy milk');
    const row = todo.closest('li');
    fireEvent.click(within(row).getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument());
    expect(global.fetch).toHaveBeenLastCalledWith('/api/todos/1', { method: 'DELETE' });
  });

  it('selects multiple todos and sends a bulk delete request', async () => {
    global.fetch
      .mockImplementationOnce(() => mockJsonResponse(initialTodos))
      .mockImplementationOnce(() => mockJsonResponse({ deletedCount: 2 }));

    render(<TodoList />);

    await screen.findByText('Buy milk');
    fireEvent.click(screen.getByLabelText('Select Buy milk'));
    fireEvent.click(screen.getByLabelText('Select Read book'));
    fireEvent.click(screen.getByRole('button', { name: /delete selected/i }));

    await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument());
    expect(screen.queryByText('Read book')).not.toBeInTheDocument();
    expect(screen.getByText('Walk dog')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith('/api/todos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [1, 3] }),
    });
  });

  it('disables bulk delete when nothing is selected', async () => {
    render(<TodoList />);

    await screen.findByText('Buy milk');
    expect(screen.getByRole('button', { name: /delete selected/i })).toBeDisabled();
  });
});
