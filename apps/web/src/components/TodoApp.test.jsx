import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import TodoApp from './TodoApp.jsx';
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api.js';

jest.mock('../api.js', () => ({
  createTodo: jest.fn(),
  deleteTodo: jest.fn(),
  listTodos: jest.fn(),
  updateTodo: jest.fn(),
}));

const todos = [
  { id: 1, title: 'Buy milk', completed: false },
  { id: 2, title: 'Read book', completed: true },
];

function renderTodoApp(props = {}) {
  const onLogout = jest.fn();
  const onUnauthorized = jest.fn();
  render(<TodoApp token="token" onLogout={onLogout} onUnauthorized={onUnauthorized} {...props} />);
  return { onLogout, onUnauthorized };
}

describe('TodoApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading and then an empty state', async () => {
    listTodos.mockResolvedValue([]);
    renderTodoApp();

    expect(screen.getByRole('status')).toHaveTextContent(/Loading todos/i);
    expect(await screen.findByText(/No todos yet/i)).toBeInTheDocument();
  });

  it('creates a todo from the add form', async () => {
    listTodos.mockResolvedValue([]);
    createTodo.mockResolvedValue({ id: 3, title: 'Plan trip', completed: false });
    renderTodoApp();

    await screen.findByText(/No todos yet/i);
    fireEvent.change(screen.getByLabelText(/New todo title/i), { target: { value: ' Plan trip ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(await screen.findByText('Plan trip')).toBeInTheDocument();
    expect(createTodo).toHaveBeenCalledWith('token', 'Plan trip');
  });

  it('edits a todo title', async () => {
    listTodos.mockResolvedValue(todos);
    updateTodo.mockResolvedValue({ id: 1, title: 'Buy oat milk', completed: false });
    renderTodoApp();

    const item = await screen.findByText('Buy milk');
    fireEvent.click(within(item.closest('li')).getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText(/Edit todo title/i), { target: { value: 'Buy oat milk' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(await screen.findByText('Buy oat milk')).toBeInTheDocument();
    expect(updateTodo).toHaveBeenCalledWith('token', 1, { title: 'Buy oat milk' });
  });

  it('toggles completion from the server response', async () => {
    listTodos.mockResolvedValue(todos);
    updateTodo.mockResolvedValue({ id: 1, title: 'Buy milk', completed: true });
    renderTodoApp();

    const checkbox = await screen.findByLabelText(/Mark Buy milk complete/i);
    fireEvent.click(checkbox);

    await waitFor(() => expect(updateTodo).toHaveBeenCalledWith('token', 1, { completed: true }));
    expect(await screen.findByLabelText(/Mark Buy milk incomplete/i)).toBeChecked();
  });

  it('deletes a todo', async () => {
    listTodos.mockResolvedValue(todos);
    deleteTodo.mockResolvedValue(null);
    renderTodoApp();

    const item = await screen.findByText('Buy milk');
    fireEvent.click(within(item.closest('li')).getByRole('button', { name: /Delete/i }));

    await waitFor(() => expect(deleteTodo).toHaveBeenCalledWith('token', 1));
    await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument());
    expect(screen.getByText('Read book')).toBeInTheDocument();
  });

  it('shows recoverable API failures', async () => {
    listTodos.mockResolvedValue([]);
    createTodo.mockRejectedValue(new Error('Could not create todo'));
    renderTodoApp();

    await screen.findByText(/No todos yet/i);
    fireEvent.change(screen.getByLabelText(/New todo title/i), { target: { value: 'Broken' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create todo');
  });

  it('signals expired sessions on unauthorized responses', async () => {
    const unauthorized = new Error('Invalid or expired token');
    unauthorized.unauthorized = true;
    listTodos.mockRejectedValue(unauthorized);
    const { onUnauthorized } = renderTodoApp();

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalledWith('Your session expired. Please log in again.'));
  });

  it('logs out when requested', async () => {
    listTodos.mockResolvedValue([]);
    const { onLogout } = renderTodoApp();

    await screen.findByText(/No todos yet/i);
    fireEvent.click(screen.getByRole('button', { name: /Log out/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
