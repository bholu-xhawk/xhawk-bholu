import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login.jsx';
import { loginUser } from '../api/auth.js';
import { AuthProvider, AUTH_TOKEN_KEY } from '../auth.jsx';

jest.mock('../api/auth.js', () => ({
  loginUser: jest.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    window.localStorage.clear();
    loginUser.mockReset();
  });

  it('stores the login token under the shared auth key', async () => {
    loginUser.mockResolvedValue({ token: 'api-token' });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBe('api-token'));
    expect(loginUser).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
  });
});
