import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AUTH_TOKEN_KEY } from './auth.jsx';
import { listCustomers } from './api/customers.js';

jest.mock('./api/auth.js', () => ({
  loginUser: jest.fn(),
}));

jest.mock('./api/customers.js', () => ({
  listCustomers: jest.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    listCustomers.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 });
  });

  it('renders Home link in navigation and Home heading by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Sign in/i })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: /Customers/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('redirects the customer route to sign in when unauthenticated', async () => {
    window.history.pushState({}, '', '/customers');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(await screen.findByRole('heading', { name: /Sign in/i })).toBeInTheDocument();
    expect(listCustomers).not.toHaveBeenCalled();
  });

  it('renders the customer route and navigation entry when authenticated', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'test-token');
    window.history.pushState({}, '', '/customers');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Customers/i })).toHaveAttribute('href', '/customers');
    expect(await screen.findByRole('heading', { name: /Customers/i })).toBeInTheDocument();
  });
});
