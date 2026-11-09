import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Todos from './Todos.jsx';

function mockJson(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function mockNoContent() {
  return Promise.resolve({
    ok: true,
    status: 204,
    json: () => Promise.reject(new Error('No content')),
  });
}

const existingTodos = [
  { id: 1, title: 'Write docs', completed: false, createdAt: '2024-06-01T00:00:00.000Z', updatedAt: '2024-06-01T00:00:00.000Z' },
  { id: 2, title: 'Ship feature', completed: true, createdAt: '2024-06-02T00:00:00.000Z', updatedAt: '2024-06-02T00:00:00.000Z' },
];

describe('Todos', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading and then the no-todos empty state', async () => {
    fetch.mockResolvedValueOnce(await mockJson([]));

    render(<Todos />);

    expect(screen.getByText(/Loading todos/i)).toBeInTheDocument();
    expect(await screen.findByText(/No todos yet/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/todos', { headers: undefined });
  });

  it('loads existing todos from the API', async () => {
    fetch.mockResolvedValueOnce(await mockJson(existingTodos));

    render(<Todos />);

    expect(await screen.findByText('Write docs')).toBeInTheDocument();
    expect(screen.getByText('Ship feature')).toBeInTheDocument();
  });

  it('adds a trimmed todo and keeps it in canonical state', async () => {
    fetch
      .mockResolvedValueOnce(await mockJson([]))
      .mockResolvedValueOnce(await mockJson({ id: 3, title: 'New task', completed: false, createdAt: 'now', updatedAt: 'now' }, 201));

    render(<Todos />);
    await screen.findByText(/No todos yet/i);

    fireEvent.change(screen.getByLabelText(/New todo title/i), { target: { value: '  New task  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(await screen.findByText('New task')).toBeInTheDocument();
    expect(screen.getByLabelText(/New todo title/i)).toHaveValue('');
    expect(fetch).toHaveBeenLastCalledWith('/api/todos', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ title: 'New task' }),
    });
  });

  it('edits a todo title with save and cancel controls', async () => {
    fetch
      .mockResolvedValueOnce(await mockJson(existingTodos))
      .mockResolvedValueOnce(await mockJson({ ...existingTodos[0], title: 'Write better docs' }));

    render(<Todos />);
    await screen.findByText('Write docs');

    fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[0]);
    const input = screen.getByLabelText(/Edit todo title/i);
    fireEvent.change(input, { target: { value: '  Write better docs  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(await screen.findByText('Write better docs')).toBeInTheDocument();
    expect(screen.queryByText('Write docs')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith('/api/todos/1', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      body: JSON.stringify({ title: 'Write better docs' }),
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[0]);
    fireEvent.change(screen.getByLabelText(/Edit todo title/i), { target: { value: 'Ignored edit' } });
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.getByText('Write better docs')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Ignored edit')).not.toBeInTheDocument();
  });

  it('completes a todo and moves it between derived filters', async () => {
    fetch
      .mockResolvedValueOnce(await mockJson(existingTodos))
      .mockResolvedValueOnce(await mockJson({ ...existingTodos[0], completed: true }));

    render(<Todos />);
    await screen.findByText('Write docs');

    fireEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(screen.getByText('Write docs')).toBeInTheDocument();
    expect(screen.queryByText('Ship feature')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Mark Write docs done/i));
    await waitFor(() => expect(screen.queryByText('Write docs')).not.toBeInTheDocument());
    expect(screen.getByText(/No active todos/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('Write docs')).toBeInTheDocument();
    expect(screen.getByText('Ship feature')).toBeInTheDocument();
  });

  it('deletes a todo from canonical state', async () => {
    fetch.mockResolvedValueOnce(await mockJson(existingTodos)).mockResolvedValueOnce(await mockNoContent());

    render(<Todos />);
    await screen.findByText('Write docs');

    const firstRow = screen.getByText('Write docs').closest('li');
    fireEvent.click(within(firstRow).getByRole('button', { name: /Delete/i }));

    await waitFor(() => expect(screen.queryByText('Write docs')).not.toBeInTheDocument());
    expect(screen.getByText('Ship feature')).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith('/api/todos/1', { method: 'DELETE', headers: undefined });
  });

  it('renders distinct empty states for active and done filters', async () => {
    fetch.mockResolvedValueOnce(await mockJson([{ ...existingTodos[0], completed: false }]));

    render(<Todos />);
    await screen.findByText('Write docs');

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText(/No done todos/i)).toBeInTheDocument();
  });

  it('shows actionable API failure feedback without discarding confirmed todos', async () => {
    fetch
      .mockResolvedValueOnce(await mockJson(existingTodos))
      .mockResolvedValueOnce(Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Failed' }) }));

    render(<Todos />);
    await screen.findByText('Write docs');

    fireEvent.click(screen.getByLabelText(/Mark Write docs done/i));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not update the todo/i);
    expect(screen.getByText('Write docs')).toBeInTheDocument();
  });

  it('shows a load failure', async () => {
    fetch.mockResolvedValueOnce(Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'Failed' }) }));

    render(<Todos />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not load todos/i);
  });
});
