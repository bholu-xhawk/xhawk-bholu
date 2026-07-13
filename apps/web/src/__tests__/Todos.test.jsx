import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Todos from '../pages/Todos.jsx';

function renderTodos() {
  render(
    <BrowserRouter>
      <Todos />
    </BrowserRouter>
  );
}

describe('Todos page', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders list from GET and supports create, toggle, and delete', async () => {
    // Initial GET
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    renderTodos();

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/todos'));

    // Create
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, title: 'A', description: '', completed: false }) });
    // refresh GET
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, title: 'A', description: '', completed: false }] });

    fireEvent.change(screen.getByLabelText('title'), { target: { value: 'A' } });
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/todos', expect.any(Object)));
    await waitFor(() => screen.getByDisplayValue('A'));

    // Toggle completed
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, title: 'A', description: '', completed: true }) });
    fireEvent.click(screen.getByLabelText('toggle-1'));
    await waitFor(() => expect(screen.getByLabelText('toggle-1')).toBeChecked());

    // Delete
    fetch.mockResolvedValueOnce({ ok: true, status: 204 });
    fireEvent.click(screen.getByLabelText('delete-1'));
    await waitFor(() => expect(screen.queryByDisplayValue('A')).not.toBeInTheDocument());
  });
});

