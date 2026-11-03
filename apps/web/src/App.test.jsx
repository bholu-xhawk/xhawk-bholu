import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { getStoredToken } from './api.js';

jest.mock('./api.js', () => ({
  getStoredToken: jest.fn(),
  login: jest.fn(),
  setStoredToken: jest.fn(),
  getTodos: jest.fn(),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  completeAllTodos: jest.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    getStoredToken.mockReturnValue(null);
  });

  it('renders Home link in navigation and Home heading by default', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('renders todo and login navigation links', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Todos/i })).toHaveAttribute('href', '/todos');
    expect(screen.getByRole('link', { name: /Login/i })).toHaveAttribute('href', '/login');
  });

  it('redirects unauthenticated todo visitors to login', async () => {
    render(
      <MemoryRouter initialEntries={['/todos']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Sign in/i })).toBeInTheDocument();
  });
});
