import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Todos from '../pages/Todos.jsx';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function installTodoFetchMock(initialTodos = []) {
  let todos = initialTodos.map((todo) => ({ ...todo }));
  let nextId = Math.max(0, ...todos.map((todo) => todo.id)) + 1;

  global.fetch = jest.fn(async (url, options = {}) => {
    const parsed = new URL(url);
    const path = parsed.pathname.replace('/api', '');
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    if (path === '/todos' && method === 'GET') {
      return jsonResponse(todos);
    }

    if (path === '/todos' && method === 'POST') {
      const todo = {
        id: nextId,
        title: body.title,
        completed: body.completed || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      nextId += 1;
      todos = [...todos, todo];
      return jsonResponse(todo, 201);
    }

    const match = path.match(/^\/todos\/(\d+)$/);
    if (match && method === 'PUT') {
      const id = Number(match[1]);
      const current = todos.find((todo) => todo.id === id);
      if (!current) return jsonResponse({ error: 'Todo not found' }, 404);
      const updated = { ...current, ...body, updatedAt: new Date().toISOString() };
      todos = todos.map((todo) => (todo.id === id ? updated : todo));
      return jsonResponse(updated);
    }

    if (match && method === 'DELETE') {
      const id = Number(match[1]);
      todos = todos.filter((todo) => todo.id !== id);
      return { ok: true, status: 204, json: async () => null };
    }

    return jsonResponse({ error: 'Not found' }, 404);
  });
}

describe('Todos', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads, creates, toggles, renames, and deletes todos', async () => {
    installTodoFetchMock([
      {
        id: 1,
        title: 'Existing todo',
        completed: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ]);

    render(<Todos />);

    expect(screen.getByText(/Loading todos/i)).toBeInTheDocument();
    expect(await screen.findByText('Existing todo')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/todos', expect.any(Object));

    fireEvent.change(screen.getByLabelText(/New todo title/i), { target: { value: 'New todo' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Todo/i }));
    expect(await screen.findByText('New todo')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/todos',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ title: 'New todo' }) })
    );

    fireEvent.click(screen.getByLabelText(/Mark Existing todo complete/i));
    await waitFor(() => expect(screen.getByLabelText(/Mark Existing todo incomplete/i)).toBeChecked());

    fireEvent.click(screen.getByRole('button', { name: /Edit Existing todo/i }));
    fireEvent.change(screen.getByLabelText(/Edit title for Existing todo/i), { target: { value: 'Renamed todo' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));
    expect(await screen.findByText('Renamed todo')).toBeInTheDocument();
    expect(screen.queryByText('Existing todo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Delete Renamed todo/i }));
    await waitFor(() => expect(screen.queryByText('Renamed todo')).not.toBeInTheDocument());
  });

  it('shows an error when loading fails', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ error: 'Backend unavailable' }, 500));

    render(<Todos />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Backend unavailable');
  });
});
