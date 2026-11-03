import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { completeAllTodos, createTodo, getTodos, updateTodo } from '../api.js';
import Todos from './Todos.jsx';

jest.mock('../api.js', () => ({
  completeAllTodos: jest.fn(),
  createTodo: jest.fn(),
  getTodos: jest.fn(),
  updateTodo: jest.fn(),
}));

const todoOne = { id: 1, title: 'Write tests', completed: false };
const todoTwo = { id: 2, title: 'Ship feature', completed: false };

function renderTodos() {
  render(
    <MemoryRouter initialEntries={['/todos']}>
      <Routes>
        <Route path="/todos" element={<Todos />} />
        <Route path="/login" element={<h1>Login page</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Todos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading and then the empty state', async () => {
    getTodos.mockResolvedValue([]);
    renderTodos();

    expect(screen.getByRole('status')).toHaveTextContent(/Loading todos/i);
    expect(await screen.findByText(/You do not have any todos yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark all done/i })).toBeDisabled();
  });

  it('adds a todo from the server response', async () => {
    getTodos.mockResolvedValue([]);
    createTodo.mockResolvedValue({ id: 3, title: 'New task', completed: false });
    renderTodos();

    await screen.findByText(/You do not have any todos yet/i);
    fireEvent.change(screen.getByLabelText(/New todo title/i), { target: { value: '  New task  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    await waitFor(() => expect(createTodo).toHaveBeenCalledWith('New task'));
    expect(await screen.findByText('New task')).toBeInTheDocument();
  });

  it('prevents blank add submissions', async () => {
    getTodos.mockResolvedValue([]);
    renderTodos();

    await screen.findByText(/You do not have any todos yet/i);
    fireEvent.change(screen.getByLabelText(/New todo title/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Todo title is required/i);
    expect(createTodo).not.toHaveBeenCalled();
  });

  it('updates one todo completion from the server response', async () => {
    getTodos.mockResolvedValue([todoOne]);
    updateTodo.mockResolvedValue({ ...todoOne, completed: true });
    renderTodos();

    await screen.findByText('Write tests');
    fireEvent.click(screen.getByRole('checkbox', { name: /Complete Write tests/i }));

    await waitFor(() => expect(updateTodo).toHaveBeenCalledWith(1, { completed: true }));
    expect(screen.getByRole('checkbox', { name: /Mark Write tests/i })).toBeChecked();
  });

  it('marks all incomplete todos done', async () => {
    getTodos.mockResolvedValue([todoOne, todoTwo]);
    completeAllTodos.mockResolvedValue([
      { ...todoOne, completed: true },
      { ...todoTwo, completed: true },
    ]);
    renderTodos();

    await screen.findByText('Write tests');
    fireEvent.click(screen.getByRole('button', { name: /Mark all done/i }));

    await waitFor(() => expect(completeAllTodos).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('checkbox', { name: /Mark Write tests/i })).toBeChecked();
    expect(screen.getByRole('button', { name: /Mark all done/i })).toBeDisabled();
  });

  it('saves inline edits and supports cancelling edits', async () => {
    getTodos.mockResolvedValue([todoOne]);
    updateTodo.mockResolvedValue({ ...todoOne, title: 'Write more tests' });
    renderTodos();

    await screen.findByText('Write tests');
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText(/Edit todo title/i), { target: { value: 'Write more tests' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(updateTodo).toHaveBeenCalledWith(1, { title: 'Write more tests' }));
    expect(await screen.findByText('Write more tests')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText(/Edit todo title/i), { target: { value: 'Discard me' } });
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(screen.getByText('Write more tests')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Discard me')).not.toBeInTheDocument();
  });

  it('saves with Enter and cancels with Escape during inline editing', async () => {
    getTodos.mockResolvedValue([todoOne]);
    updateTodo.mockResolvedValue({ ...todoOne, title: 'Keyboard save' });
    renderTodos();

    await screen.findByText('Write tests');
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText(/Edit todo title/i), { target: { value: 'Keyboard save' } });
    fireEvent.keyDown(screen.getByLabelText(/Edit todo title/i), { key: 'Enter' });

    expect(await screen.findByText('Keyboard save')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText(/Edit todo title/i), { target: { value: 'Keyboard cancel' } });
    fireEvent.keyDown(screen.getByLabelText(/Edit todo title/i), { key: 'Escape' });

    expect(screen.getByText('Keyboard save')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Keyboard cancel')).not.toBeInTheDocument();
  });

  it('preserves confirmed state and shows an error when a mutation fails', async () => {
    getTodos.mockResolvedValue([todoOne]);
    updateTodo.mockRejectedValue(new Error('Could not update todo'));
    renderTodos();

    await screen.findByText('Write tests');
    fireEvent.click(screen.getByRole('checkbox', { name: /Complete Write tests/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update todo');
    expect(screen.getByRole('checkbox', { name: /Complete Write tests/i })).not.toBeChecked();
  });

  it('redirects to login after an unauthorized API failure', async () => {
    const error = new Error('Invalid or expired token');
    error.status = 401;
    getTodos.mockRejectedValue(error);
    renderTodos();

    expect(await screen.findByRole('heading', { name: /Login page/i })).toBeInTheDocument();
  });
});
