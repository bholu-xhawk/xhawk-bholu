import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Auth from './Auth.jsx';
import { login, signup } from '../api.js';

jest.mock('../api.js', () => ({
  login: jest.fn(),
  signup: jest.fn(),
}));

function renderAuth(onAuthenticated = jest.fn()) {
  render(
    <MemoryRouter initialEntries={["/auth"]}>
      <Routes>
        <Route path="/auth" element={<Auth onAuthenticated={onAuthenticated} />} />
        <Route path="/todos" element={<h1>Todos route</h1>} />
      </Routes>
    </MemoryRouter>
  );
  return onAuthenticated;
}

function fillForm() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
}

describe('Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in and navigates to todos', async () => {
    login.mockResolvedValue({ token: 'jwt' });
    const onAuthenticated = renderAuth();
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' }));
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { name: /todos route/i })).toBeInTheDocument();
  });

  it('signs up before logging in with the same credentials', async () => {
    signup.mockResolvedValue({ id: 1 });
    login.mockResolvedValue({ token: 'jwt' });
    renderAuth();

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(signup).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' }));
    expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
    expect(await screen.findByRole('heading', { name: /todos route/i })).toBeInTheDocument();
  });

  it('shows server errors', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));
    renderAuth();
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });

  it('suppresses repeated submissions while pending', async () => {
    let resolveLogin;
    login.mockImplementation(
      () => new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    renderAuth();
    fillForm();

    const submit = screen.getByRole('button', { name: /^log in$/i });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(login).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled();

    resolveLogin({ token: 'jwt' });
    expect(await screen.findByRole('heading', { name: /todos route/i })).toBeInTheDocument();
  });
});
