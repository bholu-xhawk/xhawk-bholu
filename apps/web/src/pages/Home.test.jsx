import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import Home from './Home.jsx';

function mockJsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function mockNoContentResponse() {
  return Promise.resolve({
    ok: true,
    status: 204,
    text: () => Promise.resolve(''),
  });
}

describe('Home', () => {
  beforeEach(() => {
    window.__API_BASE_URL__ = 'http://test.local/api';
    window.fetch = jest.fn();
  });

  afterEach(() => {
    delete window.__API_BASE_URL__;
    delete window.__AUTH_TOKEN__;
    jest.restoreAllMocks();
  });

  it('loads and displays todos with a bearer token when one is available', async () => {
    window.__AUTH_TOKEN__ = 'test-token';
    window.fetch.mockResolvedValueOnce(
      await mockJsonResponse([
        { id: 1, title: 'Buy milk', completed: false },
        { id: 2, title: 'Write tests', completed: true },
      ])
    );

    render(<Home />);

    expect(screen.getByText(/Loading todos/i)).toBeInTheDocument();
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(window.fetch).toHaveBeenCalledWith(
      'http://test.local/api/todos',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      })
    );
  });

  it('prevents adding a todo while the initial load is in flight', async () => {
    let resolveLoad;
    const loadPromise = new Promise((resolve) => {
      resolveLoad = () => resolve(mockJsonResponse([]));
    });
    window.fetch.mockReturnValueOnce(loadPromise);

    render(<Home />);

    const input = screen.getByLabelText(/New todo title/i);
    const button = screen.getByRole('button', { name: /Loading/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: 'Race task' } });
    fireEvent.click(button);
    expect(window.fetch).toHaveBeenCalledTimes(1);

    resolveLoad();
    await screen.findByText(/No todos yet/i);
    expect(window.fetch).toHaveBeenCalledTimes(1);
  });

  it('adds a todo through the API', async () => {
    window.fetch
      .mockResolvedValueOnce(await mockJsonResponse([]))
      .mockResolvedValueOnce(
        await mockJsonResponse(
          { id: 3, title: 'New task', completed: false },
          201
        )
      );

    render(<Home />);

    await screen.findByText(/No todos yet/i);
    fireEvent.change(screen.getByLabelText(/New todo title/i), {
      target: { value: 'New task' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(await screen.findByText('New task')).toBeInTheDocument();
    expect(window.fetch).toHaveBeenLastCalledWith(
      'http://test.local/api/todos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New task' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(screen.getByLabelText(/New todo title/i)).toHaveValue('');
  });

  it('toggles todo completion through the API', async () => {
    window.fetch
      .mockResolvedValueOnce(
        await mockJsonResponse([{ id: 1, title: 'Buy milk', completed: false }])
      )
      .mockResolvedValueOnce(
        await mockJsonResponse({ id: 1, title: 'Buy milk', completed: true })
      );

    render(<Home />);

    const checkbox = await screen.findByRole('checkbox', {
      name: /Mark Buy milk complete/i,
    });
    fireEvent.click(checkbox);

    await waitFor(() => expect(checkbox).toBeChecked());
    expect(window.fetch).toHaveBeenLastCalledWith(
      'http://test.local/api/todos/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      })
    );
  });

  it('deletes a todo through the API', async () => {
    window.fetch
      .mockResolvedValueOnce(
        await mockJsonResponse([{ id: 1, title: 'Buy milk', completed: false }])
      )
      .mockResolvedValueOnce(await mockNoContentResponse());

    render(<Home />);

    const item = await screen.findByText('Buy milk');
    fireEvent.click(
      within(item.closest('li')).getByRole('button', { name: /Delete/i })
    );

    await waitFor(() =>
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    );
    expect(window.fetch).toHaveBeenLastCalledWith(
      'http://test.local/api/todos/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('shows API errors', async () => {
    window.fetch.mockResolvedValueOnce(
      await mockJsonResponse({ error: 'Database unavailable' }, 500)
    );

    render(<Home />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Database unavailable'
    );
  });
});
