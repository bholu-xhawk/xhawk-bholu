import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { login, setStoredToken } from '../api.js';
import Login from './Login.jsx';

jest.mock('../api.js', () => ({
  login: jest.fn(),
  setStoredToken: jest.fn(),
}));

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/todos" element={<h1>Todos destination</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores the returned token and navigates to todos', async () => {
    login.mockResolvedValue({ token: 'signed-jwt' });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'person@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'person@example.com', password: 'password123' });
      expect(setStoredToken).toHaveBeenCalledWith('signed-jwt');
    });
    expect(await screen.findByRole('heading', { name: /Todos destination/i })).toBeInTheDocument();
  });

  it('keeps the form visible and shows an error for rejected credentials', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));
    renderLogin();

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'person@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    expect(setStoredToken).not.toHaveBeenCalled();
  });
});
