import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { listCustomers } from './api/customers.js';

jest.mock('./api/customers.js', () => ({
  listCustomers: jest.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    listCustomers.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 });
  });

  it('renders Home link in navigation and Home heading by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('renders the customer route and navigation entry', async () => {
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
