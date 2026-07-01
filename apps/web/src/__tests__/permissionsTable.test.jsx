import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PermissionsTable from '../components/SuperAdmin/PermissionsTable.jsx';

describe('PermissionsTable', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('calls /api/users on mount', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ([])});
    render(<PermissionsTable />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith('/api/users');
  });

  test('falls back to sample users when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network'));
    render(<PermissionsTable />);
    await screen.findByText(/Loading users/i);
    await screen.findByText(/Failed to load users/i);
    // sample user Bob Example should appear
    await screen.findByText('Bob Example');
  });

  test('role change updates UI state', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ([{ id: 42, name: 'Test User', email: 't@example.com' }])});
    render(<PermissionsTable />);
    await screen.findByText('Test User');
    const select = screen.getByLabelText(/Role for Test User/i);
    fireEvent.change(select, { target: { value: 'Admin' } });
    expect(select.value).toBe('Admin');
    await screen.findByTestId('notice');
  });
});
