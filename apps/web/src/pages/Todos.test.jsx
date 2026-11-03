import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Todos from './Todos.jsx';
import { ApiError, completeAllTodos, createTodo, listTodos, updateTodo } from '../api.js';

jest.mock('../api.js', () => {
  class MockApiError extends Error {
    constructor(message, status) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  return {
    ApiError: MockApiError,
    completeAllTodos: jest.fn(),
    createTodo: jest.fn(),
    listTodos: jest.fn(),
    updateTodo: jest.fn(),
  };
});

function renderTodos() {
  return render(
    <MemoryRouter initialEntries={["/todos"]}>
      <Routes>
        <Route path="/todos" element={<Todos />} />
        <Route path="/login" element={<h1>Sign in route</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Todos page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading and empty states', async () => {
    listTodos.mockResolvedValue({ todos: [] });

    renderTodos();

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument();
    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('loads todos, adds a todo, completes one, and marks all done', async () => {
    const first = { id: 1, title: 'First todo', completed: false };
    const second = { id: 2, title: 'Second todo', completed: false };
    listTodos.mockResolvedValue({ todos: [first] });
    createTodo.mockResolvedValue({ todo: second });
    updateTodo.mockResolvedValue({ todo: { ...first, completed: true } });
    completeAllTodos.mockResolvedValue({ todos: [{ ...second, completed: true }, { ...first, completed: true }], updatedCount: 1 });

    renderTodos();

    expect(await screen.findByText('First todo')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/new todo/i), { target: { value: 'Second todo' } });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));

    expect(await screen.findByText('Second todo')).toBeInTheDocument();
    expect(createTodo).toHaveBeenCalledWith('Second todo');

    fireEvent.click(screen.getByLabelText(/complete first todo/i));
    await waitFor(() => expect(updateTodo).toHaveBeenCalledWith(1, { completed: true }));

    fireEvent.click(screen.getByRole('button', { name: /mark all done/i }));
    await waitFor(() => expect(completeAllTodos).toHaveBeenCalled());
    expect(screen.getByText(/0 incomplete/i)).toBeInTheDocument();
  });

  it('saves, cancels, and validates inline title editing', async () => {
    const todo = { id: 3, title: 'Original title', completed: false };
    listTodos.mockResolvedValue({ todos: [todo] });
    updateTodo.mockResolvedValue({ todo: { ...todo, title: 'Updated title' } });

    renderTodos();

    const row = (await screen.findByText('Original title')).closest('li');
    fireEvent.click(within(row).getByRole('button', { name: /edit/i }));
    fireEvent.change(within(row).getByLabelText(/edit title/i), { target: { value: '   ' } });
    fireEvent.click(within(row).getByRole('button', { name: /save/i }));
    expect(await within(row).findByRole('alert')).toHaveTextContent('Title is required');
    expect(updateTodo).not.toHaveBeenCalled();

    fireEvent.change(within(row).getByLabelText(/edit title/i), { target: { value: 'Updated title' } });
    fireEvent.click(within(row).getByRole('button', { name: /save/i }));
    expect(await screen.findByText('Updated title')).toBeInTheDocument();
    expect(updateTodo).toHaveBeenCalledWith(3, { title: 'Updated title' });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/edit title/i), { target: { value: 'Discard me' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByDisplayValue('Discard me')).not.toBeInTheDocument();
    expect(screen.getByText('Updated title')).toBeInTheDocument();
  });

  it('preserves row text and shows row errors when an edit request fails', async () => {
    const todo = { id: 4, title: 'Stable title', completed: false };
    listTodos.mockResolvedValue({ todos: [todo] });
    updateTodo.mockRejectedValue(new Error('Save failed'));

    renderTodos();

    const row = (await screen.findByText('Stable title')).closest('li');
    fireEvent.click(within(row).getByRole('button', { name: /edit/i }));
    fireEvent.change(within(row).getByLabelText(/edit title/i), { target: { value: 'New title' } });
    fireEvent.click(within(row).getByRole('button', { name: /save/i }));

    expect(await within(row).findByRole('alert')).toHaveTextContent('Save failed');
    expect(within(row).getByDisplayValue('New title')).toBeInTheDocument();
  });

  it('shows request errors and keeps typed add text', async () => {
    listTodos.mockResolvedValue({ todos: [] });
    createTodo.mockRejectedValue(new Error('Could not create'));

    renderTodos();

    await screen.findByText(/no todos yet/i);
    fireEvent.change(screen.getByLabelText(/new todo/i), { target: { value: 'Keep me' } });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create');
    expect(screen.getByDisplayValue('Keep me')).toBeInTheDocument();
  });

  it('routes unauthorized sessions back to sign in', async () => {
    listTodos.mockRejectedValue(new ApiError('Invalid or expired token', 401));

    renderTodos();

    expect(await screen.findByRole('heading', { name: /sign in route/i })).toBeInTheDocument();
  });
});
