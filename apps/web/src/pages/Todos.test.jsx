import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Todos from './Todos.jsx';

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function renderTodos(initialTodos = []) {
  globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse(initialTodos));
  render(<Todos />);
}

describe('Todos page', () => {
  beforeEach(() => {
    window.localStorage.setItem('todo-session-token', 'test-token');
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('shows loading then an empty state with the add form', async () => {
    renderTodos([]);

    expect(screen.getByText(/loading todos/i)).toBeInTheDocument();
    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'New todo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all done' })).toBeDisabled();
  });

  it('adds a todo and clears the input', async () => {
    renderTodos([]);
    await screen.findByText(/no todos yet/i);
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: 1, title: 'Buy milk', completed: false }));

    const input = screen.getByRole('textbox', { name: 'New todo' });
    fireEvent.change(input, { target: { value: '  Buy milk  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      '/api/todos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Buy milk' }),
      })
    );
  });

  it('rejects a blank new todo title without calling the API', async () => {
    renderTodos([]);
    await screen.findByText(/no todos yet/i);
    globalThis.fetch.mockClear();

    fireEvent.change(screen.getByRole('textbox', { name: 'New todo' }), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/title is required/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('saves and cancels inline edits with the keyboard', async () => {
    renderTodos([{ id: 1, title: 'Buy milk', completed: false }]);
    await screen.findByText('Buy milk');
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: 1, title: 'Buy oat milk', completed: false }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit Buy milk' }));
    const editInput = screen.getByRole('textbox', { name: 'Edit todo' });
    fireEvent.change(editInput, { target: { value: 'Buy oat milk' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    expect(await screen.findByText('Buy oat milk')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Buy oat milk' }));
    const secondEdit = screen.getByRole('textbox', { name: 'Edit todo' });
    fireEvent.change(secondEdit, { target: { value: 'Discarded change' } });
    fireEvent.keyDown(secondEdit, { key: 'Escape' });

    expect(screen.queryByDisplayValue('Discarded change')).not.toBeInTheDocument();
    expect(screen.getByText('Buy oat milk')).toBeInTheDocument();
  });

  it('marks one todo complete without changing the other', async () => {
    renderTodos([
      { id: 1, title: 'First', completed: false },
      { id: 2, title: 'Second', completed: false },
    ]);
    await screen.findByText('First');
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: 1, title: 'First', completed: true }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark First done' }));

    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Mark First incomplete' })).toBeChecked());
    expect(screen.getByRole('checkbox', { name: 'Mark Second done' })).not.toBeChecked();
  });

  it('marks every visible todo done and disables the bulk action', async () => {
    renderTodos([
      { id: 1, title: 'First', completed: false },
      { id: 2, title: 'Second', completed: false },
    ]);
    await screen.findByText('First');
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse([
        { id: 1, title: 'First', completed: true },
        { id: 2, title: 'Second', completed: true },
      ])
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mark all done' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark all done' })).toBeDisabled());
    expect(screen.getAllByRole('checkbox').every((checkbox) => checkbox.checked)).toBe(true);
  });

  it('preserves the previous visible value when an edit fails', async () => {
    renderTodos([{ id: 1, title: 'Original', completed: false }]);
    await screen.findByText('Original');
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ error: 'Nope' }, 500));

    fireEvent.click(screen.getByRole('button', { name: 'Edit Original' }));
    const editInput = screen.getByRole('textbox', { name: 'Edit todo' });
    fireEvent.change(editInput, { target: { value: 'Broken edit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/nope/i);
    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.queryByText('Broken edit')).not.toBeInTheDocument();
  });

  it('shows a load failure and keeps the add form available', async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse({ error: 'Invalid or expired token' }, 401));
    render(<Todos />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or expired token/i);
    expect(screen.getByRole('textbox', { name: 'New todo' })).toBeInTheDocument();
  });

  it('renders todo rows as list items', async () => {
    renderTodos([{ id: 1, title: 'Listed', completed: false }]);

    const list = await screen.findByRole('list', { name: 'Todo list' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });
});
