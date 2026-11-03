import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Auth from './Auth.jsx';
import { TOKEN_STORAGE_KEY } from '../lib/api.js';

function response(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  });
}

describe('Auth', () => {
  beforeEach(() => {
    window.localStorage.clear();
    globalThis.fetch = jest.fn();
  });

  it('logs in, stores the token, and notifies the app', async () => {
    const onAuthenticated = jest.fn();
    globalThis.fetch.mockReturnValueOnce(response({ token: 'login-token' }));

    render(<Auth onAuthenticated={onAuthenticated} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(within(screen.getByRole('form')).getByRole('button', { name: /^log in$/i }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('login-token'));
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('login-token');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
  });

  it('signs up then logs in to obtain the existing auth token', async () => {
    const onAuthenticated = jest.fn();
    globalThis.fetch
      .mockReturnValueOnce(response({ id: 1, email: 'new@example.com' }, 201))
      .mockReturnValueOnce(response({ token: 'signup-token' }));

    render(<Auth onAuthenticated={onAuthenticated} />);

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('signup-token'));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, '/api/auth/signup', expect.objectContaining({ method: 'POST' }));
    expect(globalThis.fetch).toHaveBeenNthCalledWith(2, '/api/auth/login', expect.objectContaining({ method: 'POST' }));
  });

  it('surfaces server errors without storing a token', async () => {
    globalThis.fetch.mockReturnValueOnce(response({ error: 'Invalid email or password' }, 400));

    render(<Auth onAuthenticated={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'bad' } });
    fireEvent.click(within(screen.getByRole('form')).getByRole('button', { name: /^log in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
