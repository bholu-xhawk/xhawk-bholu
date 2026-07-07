import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Students from '../pages/Students.jsx';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Students page with paginated table', () => {
  test('renders heading and default page content', () => {
    const { container } = renderWithRouter(<Students />);

    // Heading present
    expect(screen.getByRole('heading', { name: /students/i })).toBeInTheDocument();

    // Default rows per page = 10
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(10);

    // Summary text
    expect(screen.getByText(/Showing 1-10 of 100 students/i)).toBeInTheDocument();
  });

  test('next page updates visible rows and summary', () => {
    const { container } = renderWithRouter(<Students />);

    const firstCellBefore = container.querySelector('tbody tr:first-child td:first-child');
    expect(firstCellBefore.textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    const firstCellAfter = container.querySelector('tbody tr:first-child td:first-child');
    expect(firstCellAfter.textContent).toBe('11');

    // Summary updates
    expect(screen.getByText(/Showing 11-20 of 100 students/i)).toBeInTheDocument();
  });

  test('changing page size to 20 shows 20 rows and clamps last page correctly', () => {
    const { container } = renderWithRouter(<Students />);

    const select = screen.getByLabelText(/rows per page/i);
    fireEvent.change(select, { target: { value: '20' } });

    // Now should show 20 rows on first page
    expect(container.querySelectorAll('tbody tr').length).toBe(20);
    expect(screen.getByText(/Showing 1-20 of 100 students/i)).toBeInTheDocument();

    // Jump to last page and verify summary shows 81-100
    fireEvent.click(screen.getByRole('button', { name: /last/i }));
    expect(screen.getByText(/Showing 81-100 of 100 students/i)).toBeInTheDocument();
  });
});
