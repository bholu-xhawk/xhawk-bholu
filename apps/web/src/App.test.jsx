import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { getToken, listTodos } from './api.js';

jest.mock('./api.js', () => ({
  ApiError: class ApiError extends Error {},
  clearToken: jest.fn(),
  completeAllTodos: jest.fn(),
  createTodo: jest.fn(),
  getToken: jest.fn(),
  listTodos: jest.fn(),
  login: jest.fn(),
  setToken: jest.fn(),
  updateTodo: jest.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getToken.mockReturnValue(null);
    listTodos.mockResolvedValue({ todos: [] });
  });

  it('renders primary navigation and Home heading by default', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument();
  });

  it('routes unauthenticated todo access to sign in', async () => {
    render(
      <MemoryRouter initialEntries={["/todos"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(listTodos).not.toHaveBeenCalled();
  });

  it('renders todos for an authenticated user', async () => {
    getToken.mockReturnValue('token-123');
    listTodos.mockResolvedValue({ todos: [] });

    render(
      <MemoryRouter initialEntries={["/todos"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /todos/i })).toBeInTheDocument();
    expect(await screen.findByText(/no todos yet/i)).toBeInTheDocument();
  });
});
