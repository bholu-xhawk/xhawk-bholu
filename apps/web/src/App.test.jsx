import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { clearToken, getToken, setUnauthorizedHandler } from './api.js';
import { listTodos } from './api.js';

jest.mock('./api.js', () => ({
  clearToken: jest.fn(),
  getToken: jest.fn(),
  setUnauthorizedHandler: jest.fn(),
  listTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  completeAllTodos: jest.fn(),
}));

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getToken.mockReturnValue(null);
    listTodos.mockResolvedValue([]);
  });

  it('renders Home link in navigation and Home heading by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated todo access to login', () => {
    renderApp(['/todos']);

    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });

  it('renders protected todos when a token exists', async () => {
    getToken.mockReturnValue('jwt-token');

    renderApp(['/todos']);

    expect(await screen.findByRole('heading', { name: /todos/i })).toBeInTheDocument();
    expect(listTodos).toHaveBeenCalled();
  });

  it('navigates using the About link', () => {
    renderApp();

    fireEvent.click(screen.getByRole('link', { name: /about/i }));
    expect(screen.getByRole('heading', { name: /about/i })).toBeInTheDocument();
  });

  it('logs out and returns to login', async () => {
    getToken.mockReturnValue('jwt-token');

    renderApp(['/todos']);
    await screen.findByRole('heading', { name: /todos/i });
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(clearToken).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument());
  });

  it('registers an unauthorized handler that clears the session route', async () => {
    getToken.mockReturnValue('jwt-token');
    renderApp(['/todos']);

    await screen.findByRole('heading', { name: /todos/i });
    expect(setUnauthorizedHandler).toHaveBeenCalledWith(expect.any(Function));
  });
});
