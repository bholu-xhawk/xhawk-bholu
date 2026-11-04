import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import * as customerApi from '../api/customers.js';
import CustomerForm from './CustomerForm.jsx';

jest.mock('../api/customers.js', () => ({
  createCustomer: jest.fn(),
  getCustomer: jest.fn(),
  updateCustomer: jest.fn(),
}));

function LocationActions() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate('/customers/2/edit')}>
      Load second customer
    </button>
  );
}

function renderForm(initialPath = '/customers/new', withActions = false) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }} initialEntries={[initialPath]}>
      {withActions ? <LocationActions /> : null}
      <Routes>
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers" element={<h1>Customer list</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

function fillValidCustomer({ name = ' Ada Lovelace ', email = ' ada@example.com ', company = ' Example Inc ' } = {}) {
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/company/i), { target: { value: company } });
}

describe('CustomerForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    customerApi.createCustomer.mockResolvedValue({ id: 'new-customer' });
    customerApi.updateCustomer.mockResolvedValue({ id: 'customer-1' });
    customerApi.getCustomer.mockResolvedValue({
      id: 'customer-1',
      name: 'Grace Hopper',
      email: 'grace@example.com',
      company: 'Navy',
    });
  });

  it('renders empty create mode without loading a customer', () => {
    renderForm();

    expect(screen.getByRole('heading', { name: /create customer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/company/i)).toHaveValue('');
    expect(customerApi.getCustomer).not.toHaveBeenCalled();
  });

  it('loads and prepopulates edit mode', async () => {
    renderForm('/customers/customer-1/edit');

    expect(screen.getByText(/loading customer/i)).toBeInTheDocument();
    expect(customerApi.getCustomer).toHaveBeenCalledWith('customer-1', { signal: expect.any(AbortSignal) });
    expect(await screen.findByDisplayValue('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByDisplayValue('grace@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Navy')).toBeInTheDocument();
  });

  it('shows accessible validation errors, focuses the first invalid field, and suppresses API calls', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /create customer/i }));

    const name = screen.getByLabelText(/name/i);
    const email = screen.getByLabelText(/email/i);
    const company = screen.getByLabelText(/company/i);

    expect(name).toHaveFocus();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Name is required.');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(company).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(customerApi.createCustomer).not.toHaveBeenCalled();
    expect(customerApi.updateCustomer).not.toHaveBeenCalled();
  });

  it('validates malformed email addresses before saving', () => {
    renderForm();
    fillValidCustomer({ email: 'not-an-email' });

    fireEvent.click(screen.getByRole('button', { name: /create customer/i }));

    expect(screen.getByLabelText(/email/i)).toHaveFocus();
    expect(screen.getByLabelText(/email/i)).toHaveAccessibleDescription('Enter a valid email address.');
    expect(customerApi.createCustomer).not.toHaveBeenCalled();
  });

  it('creates customers with trimmed values and navigates to the list', async () => {
    renderForm();
    fillValidCustomer();

    fireEvent.click(screen.getByRole('button', { name: /create customer/i }));

    await waitFor(() => {
      expect(customerApi.createCustomer).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        company: 'Example Inc',
      });
    });
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument();
  });

  it('updates customers with trimmed values and navigates to the list', async () => {
    renderForm('/customers/customer-1/edit');

    fireEvent.change(await screen.findByLabelText(/name/i), { target: { value: ' Grace Hopper II ' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: ' grace2@example.com ' } });
    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: ' Navy Reserve ' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(customerApi.updateCustomer).toHaveBeenCalledWith('customer-1', {
        name: 'Grace Hopper II',
        email: 'grace2@example.com',
        company: 'Navy Reserve',
      });
    });
    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument();
  });

  it('disables Save and Cancel while a save request is pending', async () => {
    let resolveCreate;
    customerApi.createCustomer.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );

    renderForm();
    fillValidCustomer();

    fireEvent.click(screen.getByRole('button', { name: /create customer/i }));

    expect(await screen.findByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    await act(async () => {
      resolveCreate({ id: 'new-customer' });
    });

    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument();
  });

  it('ignores stale edit loads after the route changes', async () => {
    const pendingLoads = {};
    customerApi.getCustomer.mockImplementation(
      (customerId) =>
        new Promise((resolve) => {
          pendingLoads[customerId] = resolve;
        })
    );

    renderForm('/customers/1/edit', true);

    fireEvent.click(screen.getByRole('button', { name: /load second customer/i }));

    await act(async () => {
      pendingLoads['2']({ id: '2', name: 'Beta User', email: 'beta@example.com', company: 'Beta Co' });
    });

    expect(await screen.findByDisplayValue('Beta User')).toBeInTheDocument();

    await act(async () => {
      pendingLoads['1']({ id: '1', name: 'Alpha User', email: 'alpha@example.com', company: 'Alpha Co' });
    });

    expect(screen.getByDisplayValue('Beta User')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Alpha User')).not.toBeInTheDocument();
  });

  it('shows load failures on the edit page', async () => {
    customerApi.getCustomer.mockRejectedValue(new Error('Customer not found'));

    renderForm('/customers/missing/edit');

    expect(await screen.findByRole('alert')).toHaveTextContent('Customer not found');
  });

  it('shows save failures and preserves entered values', async () => {
    customerApi.createCustomer.mockRejectedValue(new Error('Email already exists'));
    renderForm();
    fillValidCustomer({ name: ' Ada ', email: ' ada@example.com ', company: ' Computing ' });

    fireEvent.click(screen.getByRole('button', { name: /create customer/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists');
    expect(screen.getByLabelText(/name/i)).toHaveValue(' Ada ');
    expect(screen.getByLabelText(/email/i)).toHaveValue(' ada@example.com ');
    expect(screen.getByLabelText(/company/i)).toHaveValue(' Computing ');
    expect(screen.queryByRole('heading', { name: /customer list/i })).not.toBeInTheDocument();
  });

  it('cancels back to the customer list without persisting', async () => {
    renderForm();
    fillValidCustomer();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(await screen.findByRole('heading', { name: /customer list/i })).toBeInTheDocument();
    expect(customerApi.createCustomer).not.toHaveBeenCalled();
    expect(customerApi.updateCustomer).not.toHaveBeenCalled();
  });
});
