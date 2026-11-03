import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Todos from './Todos.jsx';
import { completeAllTodos, createTodo, listTodos, updateTodo } from '../api.js';

jest.mock('../api.js', () => ({
  listTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  completeAllTodos: jest.fn(),
}));

const firstTodo = { id: 1, title: 'Buy milk', completed: false };
const doneTodo = { id: 2, title: 'Read docs', completed: true };

async function renderLoaded(todos = [firstTodo, doneTodo]) {
  listTodos.mockResolvedValue(todos);
  render(<Todos />);
  await waitFor(() => expect(listTodos).toHaveBeenCalled());
}

describe('Todos page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads todos and shows the empty state', async () => {
    await renderLoaded([]);
    expect(screen.getByText(/No todos yet/i)).toBeInTheDocument();
    expect(screen.getByText(/0 pending/i)).toBeInTheDocument();
  });

  it('adds a trimmed todo title', async () => {
    await renderLoaded([]);
    createTodo.mockResolvedValue({ id: 3, title: 'New task', completed: false });

    fireEvent.change(screen.getByLabelText(/new todo title/i), { target: { value: '  New task  ' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(createTodo).toHaveBeenCalledWith('New task'));
    expect(screen.getByText('New task')).toBeInTheDocument();
    expect(screen.getByLabelText(/new todo title/i)).toHaveValue('');
  });

  it('saves and cancels inline title edits', async () => {
    await renderLoaded([firstTodo]);
    updateTodo.mockResolvedValue({ ...firstTodo, title: 'Buy oat milk' });

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/edit todo title/i), { target: { value: '  Buy oat milk  ' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(updateTodo).toHaveBeenCalledWith(1, { title: 'Buy oat milk' }));
    expect(screen.getByText('Buy oat milk')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/edit todo title/i), { target: { value: 'Discard me' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByDisplayValue('Discard me')).not.toBeInTheDocument();
    expect(screen.getByText('Buy oat milk')).toBeInTheDocument();
  });

  it('keeps the inline draft when saving fails', async () => {
    await renderLoaded([firstTodo]);
    updateTodo.mockRejectedValue(new Error('Save failed'));

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/edit todo title/i), { target: { value: 'Draft survives' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
    expect(screen.getByLabelText(/edit todo title/i)).toHaveValue('Draft survives');
  });

  it('completes a single todo', async () => {
    await renderLoaded([firstTodo]);
    updateTodo.mockResolvedValue({ ...firstTodo, completed: true });

    fireEvent.click(screen.getByLabelText(/complete buy milk/i));

    await waitFor(() => expect(updateTodo).toHaveBeenCalledWith(1, { completed: true }));
    expect(screen.getByLabelText(/complete buy milk/i)).toBeChecked();
  });

  it('completes all pending todos', async () => {
    await renderLoaded([firstTodo, doneTodo]);
    completeAllTodos.mockResolvedValue({ count: 1 });

    fireEvent.click(screen.getByRole('button', { name: /complete all/i }));

    await waitFor(() => expect(completeAllTodos).toHaveBeenCalled());
    expect(screen.getByText(/0 pending/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/complete buy milk/i)).toBeChecked();
  });
});
