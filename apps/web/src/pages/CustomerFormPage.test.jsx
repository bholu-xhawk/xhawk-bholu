import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CustomerFormPage from './CustomerFormPage.jsx';
import {
  createCustomer,
  getCustomer,
  updateCustomer,
} from '../api/customers.js';

jest.mock('../api/customers.js', () => ({
  createCustomer: jest.fn(),
  getCustomer: jest.fn(),
  updateCustomer: jest.fn(),
}));

function renderCustomerRoute(initialEntry = '/customers/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/customers/new" element={<CustomerFormPage />} />
        <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
        <Route path="/customers" element={<h1>Customers</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillForm({
  name = 'Ada Lovelace',
  email = 'ada@example.com',
  company = 'Lovelace Labs',
} = {}) {
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/company/i), {
    target: { value: company },
  });
}

describe('CustomerFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks blank required fields with inline errors', async () => {
    renderCustomerRoute();

    fireEvent.click(screen.getByRole('button', { name: /save customer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /fix the highlighted fields/i
    );
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/company is required/i)).toBeInTheDocument();
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it('blocks malformed email addresses', async () => {
    renderCustomerRoute();
    fillForm({ email: 'not-an-email' });

    fireEvent.click(screen.getByRole('button', { name: /save customer/i }));

    expect(
      await screen.findByText(/enter a valid email address/i)
    ).toBeInTheDocument();
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it('creates a customer and navigates back to the list', async () => {
    createCustomer.mockResolvedValueOnce({ _id: 'new-id' });
    renderCustomerRoute();
    fillForm({
      name: '  Grace Hopper  ',
      email: ' grace@example.com ',
      company: ' Navy ',
    });

    fireEvent.click(screen.getByRole('button', { name: /save customer/i }));

    await waitFor(() => {
      expect(createCustomer).toHaveBeenCalledWith({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        company: 'Navy',
      });
    });
    expect(
      await screen.findByRole('heading', { name: /customers/i })
    ).toBeInTheDocument();
  });

  it('loads and prepopulates an existing customer for editing', async () => {
    getCustomer.mockResolvedValueOnce({
      _id: 'abc123',
      name: 'Ada',
      email: 'ada@example.com',
      company: 'Lovelace Labs',
    });

    renderCustomerRoute('/customers/abc123/edit');

    expect(screen.getByRole('status')).toHaveTextContent(/loading customer/i);
    expect(await screen.findByDisplayValue('Ada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ada@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lovelace Labs')).toBeInTheDocument();
    expect(getCustomer).toHaveBeenCalledWith('abc123');
  });

  it('updates an existing customer and navigates back to the list', async () => {
    getCustomer.mockResolvedValueOnce({
      _id: 'abc123',
      name: 'Ada',
      email: 'ada@example.com',
      company: 'Lovelace Labs',
    });
    updateCustomer.mockResolvedValueOnce({ _id: 'abc123' });

    renderCustomerRoute('/customers/abc123/edit');

    await screen.findByDisplayValue('Ada');
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: ' Analytical Engines ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save customer/i }));

    await waitFor(() => {
      expect(updateCustomer).toHaveBeenCalledWith('abc123', {
        name: 'Ada',
        email: 'ada@example.com',
        company: 'Analytical Engines',
      });
    });
    expect(
      await screen.findByRole('heading', { name: /customers/i })
    ).toBeInTheDocument();
  });

  it('cancels without loading mutation APIs', async () => {
    renderCustomerRoute();
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(
      await screen.findByRole('heading', { name: /customers/i })
    ).toBeInTheDocument();
    expect(createCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it('shows load failures without rendering the form', async () => {
    getCustomer.mockRejectedValueOnce(new Error('Customer not found'));

    renderCustomerRoute('/customers/missing/edit');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/customer not found/i);
    expect(
      screen.queryByRole('button', { name: /save customer/i })
    ).not.toBeInTheDocument();
  });

  it('shows save failures and keeps entered values', async () => {
    createCustomer.mockRejectedValueOnce(new Error('Email already exists'));
    renderCustomerRoute();
    fillForm({
      name: 'Ada',
      email: 'ada@example.com',
      company: 'Lovelace Labs',
    });

    fireEvent.click(screen.getByRole('button', { name: /save customer/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/email already exists/i);
    expect(screen.getByDisplayValue('Ada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ada@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lovelace Labs')).toBeInTheDocument();
  });

  it('disables form controls while saving', async () => {
    let resolveCreate;
    createCustomer.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );
    renderCustomerRoute();
    fillForm();

    fireEvent.click(screen.getByRole('button', { name: /save customer/i }));

    const form = screen.getByRole('form', { name: /customer details/i });
    expect(within(form).getByLabelText(/name/i)).toBeDisabled();
    expect(within(form).getByLabelText(/email/i)).toBeDisabled();
    expect(within(form).getByLabelText(/company/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    resolveCreate({ _id: 'new-id' });
    expect(
      await screen.findByRole('heading', { name: /customers/i })
    ).toBeInTheDocument();
  });
});
