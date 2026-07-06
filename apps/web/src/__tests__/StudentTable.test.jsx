import React from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import StudentTable from '../components/StudentTable';
import { makeStudentList } from '../mocks/students';

function getTbodyRows() {
  const table = screen.getByRole('table');
  const tbody = table.querySelector('tbody');
  if (!tbody) return [];
  const rows = within(tbody).queryAllByRole('row');
  return rows;
}

describe('StudentTable pagination', () => {
  test('renders first page with 10 rows and correct students', () => {
    const data = makeStudentList(25);
    render(<StudentTable data={data} pageSize={10} />);

    const rows = getTbodyRows();
    expect(rows).toHaveLength(10);
    expect(screen.getByText('Student 1')).toBeInTheDocument();
    expect(screen.getByText('Student 10')).toBeInTheDocument();
    expect(screen.queryByText('Student 11')).not.toBeInTheDocument();

    // First/Prev disabled on first page
    expect(screen.getByRole('button', { name: 'first-page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'prev-page' })).toBeDisabled();

    // Indicator
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  test('next and prev navigate pages correctly', () => {
    const data = makeStudentList(25);
    render(<StudentTable data={data} pageSize={10} />);

    const next = screen.getByRole('button', { name: 'next-page' });
    fireEvent.click(next);

    // Now page 2: 11 - 20
    expect(screen.getByText('Student 11')).toBeInTheDocument();
    expect(screen.getByText('Student 20')).toBeInTheDocument();
    expect(screen.queryByText('Student 21')).not.toBeInTheDocument();

    // Prev should work
    const prev = screen.getByRole('button', { name: 'prev-page' });
    fireEvent.click(prev);
    expect(screen.getByText('Student 1')).toBeInTheDocument();
    expect(screen.queryByText('Student 11')).not.toBeInTheDocument();

    // On second page, First/Prev enabled
    fireEvent.click(next);
    expect(screen.getByRole('button', { name: 'first-page' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'prev-page' })).not.toBeDisabled();
  });

  test('last page shows remaining items and next disabled', () => {
    const data = makeStudentList(25);
    render(<StudentTable data={data} pageSize={10} />);

    const last = screen.getByRole('button', { name: 'last-page' });
    fireEvent.click(last);

    const rows = getTbodyRows();
    expect(rows).toHaveLength(5);

    expect(screen.getByRole('button', { name: 'next-page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'last-page' })).toBeDisabled();

    // Indicator should show 3 of 3
    expect(screen.getByText(/Page 3 of 3/)).toBeInTheDocument();
  });

  test('renders correctly with empty data', () => {
    render(<StudentTable data={[]} pageSize={10} />);

    const rows = getTbodyRows();
    expect(rows).toHaveLength(0);

    expect(screen.getByText(/Page 1 of 1/)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'first-page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'prev-page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'next-page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'last-page' })).toBeDisabled();
  });
});

