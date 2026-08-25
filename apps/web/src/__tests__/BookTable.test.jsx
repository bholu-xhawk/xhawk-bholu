import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BookTable from '../components/BookTable.jsx';

const books = [
  {
    id: '1',
    name: 'Dune',
    details: 'A desert planet epic',
    authors: 'Frank Herbert',
    starred: false,
  },
  {
    id: '2',
    name: 'Kindred',
    details: 'Time travel and history',
    authors: 'Octavia E. Butler',
    starred: true,
  },
];

describe('BookTable', () => {
  it('renders the required columns and book rows', () => {
    render(<BookTable books={books} onToggleStar={jest.fn()} />);

    expect(screen.getByRole('columnheader', { name: /Book Name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Details/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Authors/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Starred/i })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Dune' })).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
  });

  it('exposes accessible star buttons and calls the toggle handler', () => {
    const onToggleStar = jest.fn();
    render(<BookTable books={books} onToggleStar={onToggleStar} />);

    const starButton = screen.getByRole('button', { name: /Star Dune/i });
    const unstarButton = screen.getByRole('button', { name: /Unstar Kindred/i });

    expect(starButton).toHaveAttribute('aria-pressed', 'false');
    expect(unstarButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(starButton);

    expect(onToggleStar).toHaveBeenCalledWith(books[0]);
  });

  it('disables a star button while that book is updating', () => {
    render(<BookTable books={books} onToggleStar={jest.fn()} updatingBookIds={new Set(['1'])} />);

    expect(screen.getByRole('button', { name: /Star Dune/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Unstar Kindred/i })).not.toBeDisabled();
  });
});
