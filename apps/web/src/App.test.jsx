import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function renderApp(initialPath = '/') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    globalThis.fetch = jest.fn();
  });

  it('renders Home link in navigation and Home heading by default', () => {
    renderApp('/');

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('redirects protected todos route to login when signed out', async () => {
    renderApp('/todos');

    expect(await screen.findByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /todos/i })).not.toBeInTheDocument();
  });

  it('shows authenticated navigation and the todos page when signed in', async () => {
    window.localStorage.setItem('todo-session-token', 'stored-token');
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([]));

    renderApp('/todos');

    expect(await screen.findByRole('heading', { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Todos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('logs out and returns to login', async () => {
    window.localStorage.setItem('todo-session-token', 'stored-token');
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([]));

    renderApp('/todos');
    await screen.findByRole('heading', { name: /todos/i });
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument());
    expect(window.localStorage.getItem('todo-session-token')).toBeNull();
  });

  it('redirects authenticated users away from login', async () => {
    window.localStorage.setItem('todo-session-token', 'stored-token');
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([]));

    renderApp('/login');

    expect(await screen.findByRole('heading', { name: /todos/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /log in/i })).not.toBeInTheDocument();
  });
});
