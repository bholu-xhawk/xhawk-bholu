import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Todos from './Todos.jsx';
import { completeAllTodos, createTodo, listTodos, updateTodo } from '../api.js';

jest.mock('../api.js', () => ({
  completeAllTodos: jest.fn(),
  createTodo: jest.fn(),
  listTodos: jest.fn(),
  updateTodo: jest.fn(),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderTodos(props = {}) {
  render(
    <MemoryRouter initialEntries={["/todos"]}>
      <Routes>
        <Route path="/todos" element={<Todos {...props} />} />
        <Route path="/auth" element={<h1>Auth route</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

async function renderLoaded(todos = []) {
  listTodos.mockResolvedValue(todos);
  renderTodos();
  await screen.findByRole('heading', { name: /todos/i });
}

const alpha = { id: 1, title: 'Alpha', completed: false };
const beta = { id: 2, title: 'Beta', completed: false };

describe('Todos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading and then an empty state', async () => {
    const load = deferred();
    listTodos.mockReturnValue(load.promise);
    renderTodos();

    expect(screen.getByRole('status')).toHaveTextContent(/loading todos/i);

    load.resolve([]);
    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('loads and renders todos', async () => {
    await renderLoaded([alpha]);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('adds a trimmed todo and rejects blank titles locally', async () => {
    await renderLoaded([]);

    fireEvent.change(screen.getByLabelText(/new todo/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(createTodo).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be blank/i);

    createTodo.mockResolvedValue({ id: 3, title: 'New todo', completed: false });
    fireEvent.change(screen.getByLabelText(/new todo/i), { target: { value: '  New todo  ' } });
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => expect(createTodo).toHaveBeenCalledWith('New todo'));
    expect(await screen.findByRole('checkbox', { name: /complete new todo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^new todo$/i, { selector: 'input' })).toHaveValue('');
  });

  it('completes one todo and disables its control while pending', async () => {
    await renderLoaded([alpha]);
    const completion = deferred();
    updateTodo.mockReturnValue(completion.promise);

    const checkbox = screen.getByRole('checkbox', { name: /complete alpha/i });
    fireEvent.click(checkbox);

    expect(updateTodo).toHaveBeenCalledWith(1, { completed: true });
    expect(checkbox).toBeDisabled();

    completion.resolve({ ...alpha, completed: true });
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /complete alpha/i })).toBeChecked());
  });

  it('completes all outstanding todos', async () => {
    await renderLoaded([alpha, beta]);
    completeAllTodos.mockResolvedValue([
      { ...alpha, completed: true },
      { ...beta, completed: true },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /complete all/i }));

    await waitFor(() => expect(completeAllTodos).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('checkbox', { name: /complete alpha/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /complete beta/i })).toBeChecked();
  });

  it('inline-edits via one guarded commit for Enter followed by blur', async () => {
    await renderLoaded([alpha]);
    const save = deferred();
    updateTodo.mockReturnValue(save.promise);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const input = screen.getByLabelText(/edit alpha/i);
    fireEvent.change(input, { target: { value: '  Renamed  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);

    expect(updateTodo).toHaveBeenCalledTimes(1);
    expect(updateTodo).toHaveBeenCalledWith(1, { title: 'Renamed' });

    save.resolve({ ...alpha, title: 'Renamed' });
    expect(await screen.findByText('Renamed')).toBeInTheDocument();
  });

  it('skips unchanged edits and cancels on Escape', async () => {
    await renderLoaded([alpha]);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.keyDown(screen.getByLabelText(/edit alpha/i), { key: 'Enter' });
    expect(updateTodo).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/edit alpha/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/edit alpha/i), { target: { value: 'Changed' } });
    fireEvent.keyDown(screen.getByLabelText(/edit alpha/i), { key: 'Escape' });
    expect(updateTodo).not.toHaveBeenCalled();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('shows action failures and load failures', async () => {
    await renderLoaded([alpha]);
    updateTodo.mockRejectedValue(new Error('Save failed'));

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    const input = screen.getByLabelText(/edit alpha/i);
    fireEvent.change(input, { target: { value: 'Broken' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');

    cleanup();
    jest.clearAllMocks();
    listTodos.mockRejectedValue(new Error('Load failed'));
    renderTodos();
    expect(await screen.findByRole('alert')).toHaveTextContent('Load failed');
  });

  it('redirects unauthorized users to auth', async () => {
    const err = new Error('Unauthorized');
    err.status = 401;
    listTodos.mockRejectedValue(err);

    const onUnauthorized = jest.fn();
    renderTodos({ onUnauthorized });

    expect(await screen.findByRole('heading', { name: /auth route/i })).toBeInTheDocument();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('keeps controls scoped to the affected row', async () => {
    await renderLoaded([alpha, beta]);
    const alphaRow = screen.getByText('Alpha').closest('li');
    const betaRow = screen.getByText('Beta').closest('li');
    updateTodo.mockReturnValue(deferred().promise);

    fireEvent.click(within(alphaRow).getByRole('checkbox', { name: /complete alpha/i }));

    expect(within(alphaRow).getByRole('checkbox', { name: /complete alpha/i })).toBeDisabled();
    expect(within(betaRow).getByRole('checkbox', { name: /complete beta/i })).not.toBeDisabled();
  });
});
