import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CustomerForm from './CustomerForm.jsx';
import { createCustomer, getCustomer, updateCustomer } from '../api/customers.js';

jest.mock('../api/customers.js', () => ({
  createCustomer: jest.fn(),
  getCustomer: jest.fn(),
  updateCustomer: jest.fn(),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function renderCustomerForm(initialEntries = ['/customers/new']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers" element={<h1>Customers list</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

function changeField(name, value) {
  fireEvent.change(screen.getByLabelText(name), { target: { value } });
}

function fillValidCustomer(values = {}) {
  changeField(/name/i, values.name ?? '  Ada Lovelace  ');
  changeField(/email/i, values.email ?? '  ada@example.com  ');
  changeField(/company/i, values.company ?? '  Analytical Engines  ');
}

describe('CustomerForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows inline errors and does not submit when required fields are empty', () => {
    renderCustomerForm();

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Company is required.')).toBeInTheDocument();
    expect(createCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it('shows an inline error for a malformed email address', () => {
    renderCustomerForm();

    fillValidCustomer({ email: 'not-an-email' });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it('creates a trimmed customer and navigates back to the customer list', async () => {
    createCustomer.mockResolvedValue({ id: 7 });
    renderCustomerForm();

    fillValidCustomer();
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(createCustomer).toHaveBeenCalledWith({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        company: 'Analytical Engines',
      });
    });
    expect(updateCustomer).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: /customers list/i })).toBeInTheDocument();
  });

  it('locks the save button while create is pending to prevent duplicate submissions', async () => {
    const save = deferred();
    createCustomer.mockReturnValue(save.promise);
    renderCustomerForm();

    fillValidCustomer();
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled());
    fireEvent.click(screen.getByRole('button', { name: /saving/i }));
    expect(createCustomer).toHaveBeenCalledTimes(1);

    save.resolve({ id: 7 });
    expect(await screen.findByRole('heading', { name: /customers list/i })).toBeInTheDocument();
  });

  it('shows a loading state in edit mode and populates fields after loading', async () => {
    const load = deferred();
    getCustomer.mockReturnValue(load.promise);
    renderCustomerForm(['/customers/42/edit']);

    expect(screen.getByRole('status')).toHaveTextContent('Loading customer');
    load.resolve({ name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' });

    expect(await screen.findByDisplayValue('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByDisplayValue('grace@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Navy')).toBeInTheDocument();
    expect(getCustomer).toHaveBeenCalledWith('42');
  });

  it('updates a trimmed customer in edit mode and navigates back to the customer list', async () => {
    getCustomer.mockResolvedValue({ name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' });
    updateCustomer.mockResolvedValue({ id: 42 });
    renderCustomerForm(['/customers/42/edit']);

    await screen.findByDisplayValue('Grace Hopper');
    changeField(/name/i, '  Rear Admiral Grace Hopper  ');
    changeField(/company/i, '  COBOL  ');
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(updateCustomer).toHaveBeenCalledWith('42', {
        name: 'Rear Admiral Grace Hopper',
        email: 'grace@example.com',
        company: 'COBOL',
      });
    });
    expect(createCustomer).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: /customers list/i })).toBeInTheDocument();
  });

  it('cancels back to the customer list without creating or updating', () => {
    renderCustomerForm();

    fillValidCustomer();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('heading', { name: /customers list/i })).toBeInTheDocument();
    expect(createCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it('shows a load error and can retry loading the customer', async () => {
    getCustomer
      .mockRejectedValueOnce(new Error('Customer not found'))
      .mockResolvedValueOnce({ name: 'Katherine Johnson', email: 'katherine@example.com', company: 'NASA' });
    renderCustomerForm(['/customers/99/edit']);

    expect(await screen.findByRole('alert')).toHaveTextContent('Customer not found');
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByDisplayValue('Katherine Johnson')).toBeInTheDocument();
    expect(getCustomer).toHaveBeenCalledTimes(2);
  });

  it('maps API field errors inline and preserves entered values', async () => {
    createCustomer.mockRejectedValue({
      message: 'Invalid input',
      fieldErrors: { email: 'Email already belongs to another customer.' },
    });
    renderCustomerForm();

    fillValidCustomer({ email: 'duplicate@example.com' });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText('Email already belongs to another customer.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid input');
    expect(screen.getByLabelText(/email/i)).toHaveValue('duplicate@example.com');
  });

  it('preserves values after a failed save and allows a successful retry', async () => {
    createCustomer.mockRejectedValueOnce(new Error('Server unavailable')).mockResolvedValueOnce({ id: 8 });
    renderCustomerForm();

    fillValidCustomer({ name: 'Margaret Hamilton', email: 'margaret@example.com', company: 'NASA' });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable');
    expect(screen.getByLabelText(/name/i)).toHaveValue('Margaret Hamilton');

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByRole('heading', { name: /customers list/i })).toBeInTheDocument();
    expect(createCustomer).toHaveBeenCalledTimes(2);
  });
});
