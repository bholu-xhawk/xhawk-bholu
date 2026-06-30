import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SuperAdmin from '../pages/SuperAdmin.jsx';

// Mock child components' network calls through global.fetch
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.resetAllMocks();
  if (global.fetch) delete global.fetch;
});

describe('SuperAdmin page', () => {
  test('renders sections and settings persist to localStorage', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ([{ id: 1, name: 'Alice', email: 'a@a.com' }])});

    // Mock localStorage
    const store = {};
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((k) => store[k] ?? null);
    jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation((k, v) => { store[k] = v; });

    render(<SuperAdmin />);

    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText(/Advanced Controls/)).toBeInTheDocument();
    expect(screen.getByText(/Permissions Management/)).toBeInTheDocument();
    expect(screen.getByText(/System-wide Settings/)).toBeInTheDocument();

    // Wait for permissions table
    await screen.findByText('Alice');

    // Toggle a persisted setting in SettingsPanel
    const maintenanceToggle = screen.getByLabelText('Maintenance mode');
    expect(maintenanceToggle).toBeInTheDocument();
    fireEvent.click(maintenanceToggle);

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });
  });

  test('role select updates state inside table', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ([{ id: 2, name: 'Bob', email: 'b@b.com' }])});

    render(<SuperAdmin />);
    await screen.findByText('Bob');
    const select = screen.getByLabelText(/Role for Bob/);
    fireEvent.change(select, { target: { value: 'Super Admin' } });
    expect(select.value).toBe('Super Admin');
  });
});
