import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

function renderWithRoute(initialEntries) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('Super Admin view', () => {
  afterEach(() => {
    window.localStorage.removeItem('role');
  });

  test('denies access when role not set', () => {
    renderWithRoute(['/super-admin']);
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    expect(screen.getByText(/development-only guard/i)).toBeInTheDocument();
  });

  test('renders when role is superadmin', () => {
    window.localStorage.setItem('role', 'superadmin');
    renderWithRoute(['/super-admin']);
    expect(screen.getByRole('heading', { name: /Super Admin/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Advanced Controls/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Permissions Manager/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /System Settings/i })).toBeInTheDocument();
  });

  test('basic interaction: toggle maintenance and grant role', () => {
    window.localStorage.setItem('role', 'superadmin');
    renderWithRoute(['/super-admin']);

    // Toggle maintenance
    const toggleBtn = screen.getByRole('button', { name: /Enable Maintenance/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Disable Maintenance/i })).toBeInTheDocument();

    // Grant a role to a user (pick Alice -> grant admin)
    const grantSelect = screen.getByTestId('role-select-1');
    fireEvent.change(grantSelect, { target: { value: 'admin' } });
    const grantBtn = grantSelect.parentElement.querySelector('button');
    fireEvent.click(grantBtn);
    // Role badge should appear
    expect(screen.getAllByText(/admin/i).length).toBeGreaterThan(0);
  });
});

