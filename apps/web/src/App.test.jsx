import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import * as todoApi from './api/todos.js';

jest.mock('./api/todos.js', () => ({
  fetchTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}));

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads todos and supports adding, completing, and deleting tasks', async () => {
    todoApi.fetchTodos.mockResolvedValue([
      { id: 1, title: 'Write tests', completed: false },
      { id: 2, title: 'Ship feature', completed: true },
    ]);
    todoApi.createTodo.mockResolvedValue({ id: 3, title: 'Document behavior', completed: false });
    todoApi.updateTodo.mockResolvedValue({ id: 1, title: 'Write tests', completed: true });
    todoApi.deleteTodo.mockResolvedValue(null);

    renderApp();

    expect(screen.getByText(/Todos/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Today.s Tasks/i })).toBeInTheDocument();
    expect(await screen.findByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('Ship feature')).toHaveClass('todo-title--done');

    fireEvent.change(screen.getByLabelText(/New todo/i), { target: { value: 'Document behavior' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    await waitFor(() => expect(todoApi.createTodo).toHaveBeenCalledWith('Document behavior'));
    expect(await screen.findByText('Document behavior')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mark Write tests complete/i }));

    await waitFor(() => expect(todoApi.updateTodo).toHaveBeenCalledWith(1, { completed: true }));
    await waitFor(() => expect(screen.getByLabelText(/Mark Write tests incomplete/i)).toBeInTheDocument());
    expect(screen.getByText('Write tests')).toHaveClass('todo-title--done');

    fireEvent.click(screen.getByRole('button', { name: /Delete Document behavior/i }));

    await waitFor(() => expect(todoApi.deleteTodo).toHaveBeenCalledWith(3));
    await waitFor(() => expect(screen.queryByText('Document behavior')).not.toBeInTheDocument());
  });

  it('shows an error when loading todos fails', async () => {
    todoApi.fetchTodos.mockRejectedValue(new Error('API unavailable'));

    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent('API unavailable');
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });
});
