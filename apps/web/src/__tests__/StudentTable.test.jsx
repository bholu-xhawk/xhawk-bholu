import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentTable from '../components/StudentTable.jsx';

function setup() {
  const user = userEvent.setup();
  render(<StudentTable />);
  return { user };
}

describe('StudentTable', () => {
  test('initial render shows students', () => {
    setup();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Evan')).toBeInTheDocument();
  });

  test('Select All toggles all rows', async () => {
    const { user } = setup();
    const master = screen.getByLabelText('Select All');

    // Check all
    await user.click(master);

    // All row checkboxes should be checked
    const rows = screen.getAllByRole('row');
    // Skip header row (first)
    const bodyRows = rows.slice(1);
    bodyRows.forEach((row) => {
      const checkbox = within(row).queryByRole('checkbox');
      if (checkbox) {
        expect(checkbox).toBeChecked();
      }
    });

    // Uncheck all
    await user.click(master);
    bodyRows.forEach((row) => {
      const checkbox = within(row).queryByRole('checkbox');
      if (checkbox) {
        expect(checkbox).not.toBeChecked();
      }
    });
  });

  test('single row delete removes only that row', async () => {
    const { user } = setup();

    const rowAlice = screen.getByText('Alice').closest('tr');
    expect(rowAlice).toBeTruthy();
    const deleteAlice = within(rowAlice).getByRole('button', { name: /delete/i });

    await user.click(deleteAlice);

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  test('Delete Selected removes multiple and disables when none selected', async () => {
    const { user } = setup();

    const deleteSelected = screen.getByRole('button', { name: /delete selected/i });
    expect(deleteSelected).toBeDisabled();

    await user.click(screen.getByLabelText('Select Alice'));
    await user.click(screen.getByLabelText('Select Bob'));

    expect(deleteSelected).toBeEnabled();

    await user.click(deleteSelected);

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();

    // Button disabled again when none selected
    expect(deleteSelected).toBeDisabled();
  });

  test('edge case: deleting all rows keeps master unchecked and no crash', async () => {
    const { user } = setup();

    // Select all then delete selected
    const master = screen.getByLabelText('Select All');
    await user.click(master);

    const deleteSelected = screen.getByRole('button', { name: /delete selected/i });
    await user.click(deleteSelected);

    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('No students')).toBeInTheDocument();

    // Master should be unchecked
    expect(master).not.toBeChecked();

    // Delete Selected should be disabled
    expect(deleteSelected).toBeDisabled();
  });
});
