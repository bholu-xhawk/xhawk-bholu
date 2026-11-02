import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Auth from './Auth.jsx';

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function renderAuth(path = '/login', onLogin = jest.fn()) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Auth onLogin={onLogin} />
    </MemoryRouter>
  );
  return onLogin;
}

describe('Auth page', () => {
  beforeEach(() => {
    window.localStorage.clear();
    globalThis.fetch = jest.fn();
  });

  it('logs in and stores the returned token', async () => {
    globalThis.fetch.mockResolvedValueOnce(await jsonResponse({ token: 'login-token' }));
    const onLogin = renderAuth('/login');

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('login-token'));
    expect(window.localStorage.getItem('todo-session-token')).toBe('login-token');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
  });

  it('signs up then logs in with the new account', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(await jsonResponse({ id: 1, email: 'new@example.com' }, 201))
      .mockResolvedValueOnce(await jsonResponse({ token: 'signup-token' }));
    const onLogin = renderAuth('/signup');

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('signup-token'));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, '/api/auth/signup', expect.objectContaining({ method: 'POST' }));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(2, '/api/auth/login', expect.objectContaining({ method: 'POST' }));
  });

  it('shows local validation and server errors', async () => {
    renderAuth('/login');

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/email is required/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    globalThis.fetch.mockResolvedValueOnce(await jsonResponse({ error: 'Invalid email or password' }, 400));
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);
  });

  it('disables submission while a request is pending', async () => {
    let resolveRequest;
    globalThis.fetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const onLogin = renderAuth('/login');

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'slow@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled();

    resolveRequest(await jsonResponse({ token: 'slow-token' }));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('slow-token'));
  });
});
