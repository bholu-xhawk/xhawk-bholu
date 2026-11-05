import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { getCustomer } from './api/customers.js';

jest.mock('./api/customers.js', () => ({
  createCustomer: jest.fn(),
  getCustomer: jest.fn(),
  updateCustomer: jest.fn(),
}));

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Home link in navigation and Home heading by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('routes /customers/new to the shared customer form', () => {
    renderApp(['/customers/new']);

    expect(screen.getByRole('heading', { name: /new customer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(getCustomer).not.toHaveBeenCalled();
  });

  it('routes /customers/:id/edit to the shared customer form and loads the customer', async () => {
    getCustomer.mockResolvedValue({ name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' });

    renderApp(['/customers/42/edit']);

    expect(screen.getByRole('status')).toHaveTextContent('Loading customer');
    expect(await screen.findByRole('heading', { name: /edit customer/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Grace Hopper')).toBeInTheDocument();
    expect(getCustomer).toHaveBeenCalledWith('42');
  });
});
