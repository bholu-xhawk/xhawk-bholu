import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

function jsonResponse(body, init = {}) {
  return Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: () => Promise.resolve(body),
  });
}

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn(() => jsonResponse([]));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the Todo UI and loads todos', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      await jsonResponse([
        { id: 1, title: 'Write tests', description: 'Cover todo UI', completed: false },
        { id: 2, title: 'Ship feature', description: null, completed: true },
      ])
    );

    renderApp();

    expect(screen.getByText(/Todos/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Manage todos/i })).toBeInTheDocument();
    expect(await screen.findByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText(/✓ Ship feature/)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/todos');
  });

  it('submits a create request to the todos API', async () => {
    const createdTodo = { id: 3, title: 'New todo', description: 'From the form', completed: true };
    globalThis.fetch
      .mockResolvedValueOnce(await jsonResponse([]))
      .mockResolvedValueOnce(await jsonResponse(createdTodo, { status: 201 }))
      .mockResolvedValueOnce(await jsonResponse([createdTodo]));

    renderApp();
    await screen.findByText(/No todos yet/i);

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New todo' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'From the form' } });
    fireEvent.click(screen.getByLabelText(/Completed/i));
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/todos',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New todo', description: 'From the form', completed: true }),
      })
    );
    expect(await screen.findByRole('heading', { name: /New todo/i })).toBeInTheDocument();
  });

  it('submits an edit request to the selected todo endpoint', async () => {
    const todo = { id: 4, title: 'Old title', description: '', completed: false };
    const updatedTodo = { ...todo, title: 'Updated title', completed: true };
    globalThis.fetch
      .mockResolvedValueOnce(await jsonResponse([todo]))
      .mockResolvedValueOnce(await jsonResponse(updatedTodo))
      .mockResolvedValueOnce(await jsonResponse([updatedTodo]));

    renderApp();
    expect(await screen.findByText('Old title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Updated title' } });
    fireEvent.click(screen.getByLabelText(/Completed/i));
    fireEvent.click(screen.getByRole('button', { name: /Save edits/i }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(3));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/todos/4',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated title', completed: true }),
      })
    );
    expect(await screen.findByRole('heading', { name: /Updated title/i })).toBeInTheDocument();
  });
});
