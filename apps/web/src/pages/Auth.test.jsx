import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Auth from './Auth.jsx';
import { login } from '../api.js';

jest.mock('../api.js', () => ({
  login: jest.fn(),
}));

describe('Auth page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs in and routes to todos on success', async () => {
    login.mockResolvedValue({ token: 'token-123' });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/todos" element={<h1>Todos route</h1>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' }));
    expect(await screen.findByRole('heading', { name: /todos route/i })).toBeInTheDocument();
  });

  it('shows invalid credential errors without leaving the page', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'bad-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  });
});
