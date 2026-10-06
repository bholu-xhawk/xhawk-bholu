import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { login } from './api.js';

jest.mock('./api.js', () => ({
  login: jest.fn(),
  signup: jest.fn(),
  listTodos: jest.fn(() => Promise.resolve([])),
}));

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders the signed-out todo shell by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Todo Workspace/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Todo list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument();
  });

  it('stores a token and shows the todo app after login', async () => {
    login.mockResolvedValue({ token: 'jwt-token' });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /My todos/i })).toBeInTheDocument());
    expect(window.localStorage.getItem('todoToken')).toBe('jwt-token');
    expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
  });
});
