import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Auth from './Auth.jsx';
import { login, signup, storeToken } from '../api.js';

jest.mock('../api.js', () => ({
  login: jest.fn(),
  signup: jest.fn(),
  storeToken: jest.fn(),
}));

describe('Auth page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs in and stores the returned token', async () => {
    login.mockResolvedValue({ token: 'jwt-token' });
    const onAuthenticated = jest.fn();

    render(<Auth onAuthenticated={onAuthenticated} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^log in$/i }).at(-1));

    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' }));
    expect(storeToken).toHaveBeenCalledWith('jwt-token');
    expect(onAuthenticated).toHaveBeenCalledWith('jwt-token');
  });

  it('signs up and then logs in with the same credentials', async () => {
    signup.mockResolvedValue({ id: 1 });
    login.mockResolvedValue({ token: 'signup-token' });
    const onAuthenticated = jest.fn();

    render(<Auth onAuthenticated={onAuthenticated} />);
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^sign up$/i }).at(-1));

    await waitFor(() => expect(signup).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password123', name: 'Ada' }));
    expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password123' });
    expect(onAuthenticated).toHaveBeenCalledWith('signup-token');
  });

  it('keeps entered values visible when credentials are rejected', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));

    render(<Auth onAuthenticated={jest.fn()} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^log in$/i }).at(-1));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByLabelText(/email/i)).toHaveValue('bad@example.com');
    expect(screen.getByLabelText(/password/i)).toHaveValue('wrong');
  });
});
