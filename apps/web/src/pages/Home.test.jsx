import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import Home from './Home.jsx';
import { fetchBooks, updateBookStarred } from '../api/books.js';

jest.mock('../api/books.js', () => ({
  fetchBooks: jest.fn(),
  updateBookStarred: jest.fn(),
}));

const books = [
  { id: 'book-1', name: 'Dune', authors: ['Frank Herbert'], starred: false },
  {
    id: 'book-2',
    name: 'Parable of the Sower',
    authors: ['Octavia E. Butler'],
    starred: true,
  },
];

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders fetched books with authors and starred status', async () => {
    fetchBooks.mockResolvedValue(books);

    render(<Home />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading books');
    expect(
      await screen.findByRole('heading', { name: /Books/i })
    ).toBeInTheDocument();

    const duneRow = await screen.findByRole('row', {
      name: /Dune Frank Herbert No Star/i,
    });
    expect(within(duneRow).getByText('Frank Herbert')).toBeInTheDocument();
    expect(within(duneRow).getByText('No')).toBeInTheDocument();

    const parableRow = await screen.findByRole('row', {
      name: /Parable of the Sower Octavia E\. Butler Yes Unstar/i,
    });
    expect(
      within(parableRow).getByText('Octavia E. Butler')
    ).toBeInTheDocument();
    expect(within(parableRow).getByText('Yes')).toBeInTheDocument();
  });

  it('updates a row from the backend response when starred status is toggled', async () => {
    fetchBooks.mockResolvedValue([books[0]]);
    updateBookStarred.mockResolvedValue({ ...books[0], starred: true });

    render(<Home />);

    fireEvent.click(await screen.findByRole('button', { name: 'Star Dune' }));

    expect(updateBookStarred).toHaveBeenCalledWith('book-1', true);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Unstar Dune' })
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole('row', { name: /Dune Frank Herbert Yes Unstar/i })
    ).toBeInTheDocument();
  });

  it('shows an error when books cannot be loaded', async () => {
    fetchBooks.mockRejectedValue(new Error('Backend unavailable'));

    render(<Home />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Backend unavailable'
    );
  });

  it('shows an empty state when the API returns no books', async () => {
    fetchBooks.mockResolvedValue([]);

    render(<Home />);

    expect(
      await screen.findByText('No books are available yet.')
    ).toBeInTheDocument();
  });

  it('shows an error and keeps existing starred state when a toggle fails', async () => {
    fetchBooks.mockResolvedValue([books[0]]);
    updateBookStarred.mockRejectedValue(new Error('Unable to update book'));

    render(<Home />);

    fireEvent.click(await screen.findByRole('button', { name: 'Star Dune' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to update book'
    );
    expect(
      screen.getByRole('row', { name: /Dune Frank Herbert No Star/i })
    ).toBeInTheDocument();
  });
});
