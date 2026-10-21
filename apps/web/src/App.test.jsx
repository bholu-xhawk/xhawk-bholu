import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { apiRequest } from './lib/api.js';

jest.mock('./lib/api.js', () => ({
  apiRequest: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    apiRequest.mockResolvedValue({ items: [], total: 0, page: 1, page_size: 10 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated visitors to login for protected todos', () => {
    renderApp(['/']);
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^todos$/i })).not.toBeInTheDocument();
  });

  it('logs in, stores the token, and renders protected todos', async () => {
    apiRequest.mockImplementation((path) => {
      if (path === '/auth/login') return Promise.resolve({ token: 'jwt-token' });
      if (path.startsWith('/todos')) return Promise.resolve({ items: [], total: 0, page: 1, page_size: 10 });
      return Promise.reject(new Error(`unexpected ${path}`));
    });

    renderApp(['/login']);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => expect(window.localStorage.getItem('todo_jwt')).toBe('jwt-token'));
    expect(await screen.findByRole('heading', { name: /^todos$/i })).toBeInTheDocument();
  });

  it('signs up by creating the user and then logging in', async () => {
    apiRequest.mockImplementation((path) => {
      if (path === '/auth/signup') return Promise.resolve({ id: 1, email: 'new@example.com' });
      if (path === '/auth/login') return Promise.resolve({ token: 'signup-token' });
      if (path.startsWith('/todos')) return Promise.resolve({ items: [], total: 0, page: 1, page_size: 10 });
      return Promise.reject(new Error(`unexpected ${path}`));
    });

    renderApp(['/signup']);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/auth/signup', expect.objectContaining({ method: 'POST' })));
    expect(apiRequest).toHaveBeenCalledWith('/auth/login', expect.objectContaining({ body: { email: 'new@example.com', password: 'password123' } }));
    expect(await screen.findByRole('heading', { name: /^todos$/i })).toBeInTheDocument();
  });

  it('logs out and returns to the login route', async () => {
    window.localStorage.setItem('todo_jwt', 'token');
    renderApp(['/']);
    expect(await screen.findByRole('heading', { name: /^todos$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(window.localStorage.getItem('todo_jwt')).toBeNull();
  });
});
