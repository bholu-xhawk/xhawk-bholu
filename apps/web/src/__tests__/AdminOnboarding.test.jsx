import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AdminOnboarding from '../pages/AdminOnboarding.jsx';

// Mock the adminApi module
jest.mock('../mocks/adminApi.js', () => ({
  createAdmin: jest.fn(),
}));

import { createAdmin } from '../mocks/adminApi.js';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('AdminOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders fields and submit button', () => {
    renderWithRouter(<AdminOnboarding />);

    expect(screen.getByRole('heading', { name: /admin onboarding/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create admin/i })).toBeInTheDocument();
  });

  test('client-side validation prevents submit and shows errors', async () => {
    renderWithRouter(<AdminOnboarding />);
    const user = userEvent.setup();

    // Try submit empty form
    await user.click(screen.getByRole('button', { name: /create admin/i }));
    expect(await screen.findByText(/please fix the errors below/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();

    // Enter bad email, short password, mismatched confirmation
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.clear(screen.getByLabelText(/password$/i));
    await user.type(screen.getByLabelText(/password$/i), 'short');
    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), 'short1');

    await user.click(screen.getByRole('button', { name: /create admin/i }));

    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('success path: calls API, disables submit, shows success and clears form', async () => {
    const user = userEvent.setup();
    createAdmin.mockResolvedValueOnce({ id: 'adm_1', email: 'admin@example.com', name: null, role: 'admin', createdAt: new Date().toISOString() });

    renderWithRouter(<AdminOnboarding />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/name/i), 'Root Admin');
    await user.type(screen.getByLabelText(/password$/i), 'supersecret');
    await user.type(screen.getByLabelText(/confirm password/i), 'supersecret');

    const btn = screen.getByRole('button', { name: /create admin/i });
    await user.click(btn);

    expect(createAdmin).toHaveBeenCalledWith({ email: 'admin@example.com', name: 'Root Admin', password: 'supersecret' });

    // Button shows pending state and gets disabled
    expect(btn).toBeDisabled();

    // Success message appears
    expect(await screen.findByText(/admin created successfully for admin@example.com/i)).toBeInTheDocument();

    // Form cleared (email field empty)
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/password$/i)).toHaveValue('');
      expect(screen.getByLabelText(/confirm password/i)).toHaveValue('');
    });
  });

  test('failure path: shows submission error and keeps values', async () => {
    const user = userEvent.setup();
    createAdmin.mockRejectedValueOnce(new Error('boom'));

    renderWithRouter(<AdminOnboarding />);

    await user.type(screen.getByLabelText(/email/i), 'badfail@example.com');
    await user.type(screen.getByLabelText(/name/i), 'Ops');
    await user.type(screen.getByLabelText(/password$/i), 'supersecret');
    await user.type(screen.getByLabelText(/confirm password/i), 'supersecret');

    await user.click(screen.getByRole('button', { name: /create admin/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);

    expect(screen.getByLabelText(/email/i)).toHaveValue('badfail@example.com');
    expect(screen.getByLabelText(/name/i)).toHaveValue('Ops');
    expect(screen.getByLabelText(/password$/i)).toHaveValue('supersecret');
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('supersecret');
  });
});
