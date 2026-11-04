import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as customerApi from './api/customers.js';
import App from './App.jsx';

jest.mock('./api/customers.js', () => ({
  createCustomer: jest.fn(),
  getCustomer: jest.fn(),
  updateCustomer: jest.fn(),
}));

function renderApp(path = '/') {
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }} initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    customerApi.getCustomer.mockResolvedValue({
      id: 'customer-1',
      name: 'Grace Hopper',
      email: 'grace@example.com',
      company: 'Navy',
    });
  });

  it('renders Home link in navigation and Home heading by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('renders the customer create route through the app', () => {
    renderApp('/customers/new');

    expect(screen.getByRole('heading', { name: /create customer/i })).toBeInTheDocument();
    expect(customerApi.getCustomer).not.toHaveBeenCalled();
  });

  it('renders the customer edit route through the app', async () => {
    renderApp('/customers/customer-1/edit');

    expect(await screen.findByRole('heading', { name: /edit customer/i })).toBeInTheDocument();
    expect(customerApi.getCustomer).toHaveBeenCalledWith('customer-1', { signal: expect.any(AbortSignal) });
  });
});
