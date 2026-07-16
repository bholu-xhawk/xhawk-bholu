import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Todos from './Todos.jsx';
import * as todosApi from '../api/todos.js';

jest.mock('../api/todos.js', () => ({
  listTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}));

const todo = {
  id: 1,
  title: 'Write tests',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('Todos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    todosApi.listTodos.mockResolvedValue([]);
  });

  it('loads and renders todos', async () => {
    todosApi.listTodos.mockResolvedValueOnce([todo]);

    render(<Todos />);

    expect(screen.getByText(/Loading todos/i)).toBeInTheDocument();
    expect(await screen.findByText('Write tests')).toBeInTheDocument();
  });

  it('adds a todo', async () => {
    todosApi.createTodo.mockResolvedValueOnce({ ...todo, id: 2, title: 'Ship feature' });

    render(<Todos />);
    expect(await screen.findByText(/No todos yet/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/New todo title/i), { target: { value: 'Ship feature' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    await waitFor(() => expect(todosApi.createTodo).toHaveBeenCalledWith('Ship feature'));
    expect(await screen.findByText('Ship feature')).toBeInTheDocument();
  });

  it('toggles completion', async () => {
    todosApi.listTodos.mockResolvedValueOnce([todo]);
    todosApi.updateTodo.mockResolvedValueOnce({ ...todo, completed: true });

    render(<Todos />);

    const checkbox = await screen.findByLabelText(/Mark Write tests complete/i);
    fireEvent.click(checkbox);

    await waitFor(() => expect(todosApi.updateTodo).toHaveBeenCalledWith(1, { completed: true }));
    expect(await screen.findByLabelText(/Mark Write tests incomplete/i)).toBeChecked();
  });

  it('edits a todo title', async () => {
    todosApi.listTodos.mockResolvedValueOnce([todo]);
    todosApi.updateTodo.mockResolvedValueOnce({ ...todo, title: 'Write durable tests' });

    render(<Todos />);

    fireEvent.click(await screen.findByRole('button', { name: /Edit Write tests/i }));
    fireEvent.change(screen.getByLabelText(/Edit todo title/i), { target: { value: 'Write durable tests' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(todosApi.updateTodo).toHaveBeenCalledWith(1, { title: 'Write durable tests' }));
    expect(await screen.findByText('Write durable tests')).toBeInTheDocument();
  });

  it('deletes a todo', async () => {
    todosApi.listTodos.mockResolvedValueOnce([todo]);
    todosApi.deleteTodo.mockResolvedValueOnce(undefined);

    render(<Todos />);

    fireEvent.click(await screen.findByRole('button', { name: /Delete Write tests/i }));

    await waitFor(() => expect(todosApi.deleteTodo).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('Write tests')).not.toBeInTheDocument());
    expect(screen.getByText(/No todos yet/i)).toBeInTheDocument();
  });

  it('surfaces a failed API call', async () => {
    todosApi.listTodos.mockRejectedValueOnce(new Error('API unavailable'));

    render(<Todos />);

    expect(await screen.findByRole('alert')).toHaveTextContent('API unavailable');
  });
});
