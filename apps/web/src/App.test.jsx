import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import App from './App.jsx';

const books = [
  {
    id: 'book-1',
    name: 'Dune',
    details: 'A desert planet and a fight for its future.',
    authors: ['Frank Herbert'],
    starred: false,
  },
  {
    id: 'book-2',
    name: 'Kindred',
    details: 'A time-travel story about family and survival.',
    authors: ['Octavia E. Butler'],
    starred: true,
  },
];

function jsonResponse(body, ok = true) {
  return {
    ok,
    json: jest.fn().mockResolvedValue(body),
  };
}

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads books and renders the required table columns and rows', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse(books));

    render(<App />);

    expect(screen.getByText(/Loading books/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('columnheader', { name: 'Book Name' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Details' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Authors' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Starred' })
    ).toBeInTheDocument();

    const duneRow = screen.getByRole('row', { name: /Dune/i });
    expect(
      within(duneRow).getByText('A desert planet and a fight for its future.')
    ).toBeInTheDocument();
    expect(within(duneRow).getByText('Frank Herbert')).toBeInTheDocument();
    expect(
      within(duneRow).getByRole('button', { name: 'Star Dune' })
    ).toBeInTheDocument();

    const kindredRow = screen.getByRole('row', { name: /Kindred/i });
    expect(
      within(kindredRow).getByText('Octavia E. Butler')
    ).toBeInTheDocument();
    expect(
      within(kindredRow).getByRole('button', { name: 'Unstar Kindred' })
    ).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/books'
    );
  });

  it('renders an explicit empty state when the API has no books', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([]));

    render(<App />);

    expect(await screen.findByText(/No books yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'Book Name' })
    ).toBeInTheDocument();
  });

  it('optimistically stars and unsticks to the API response on success', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(jsonResponse(books))
      .mockResolvedValueOnce(jsonResponse({ ...books[0], starred: true }));

    render(<App />);

    const starButton = await screen.findByRole('button', { name: 'Star Dune' });
    fireEvent.click(starButton);

    expect(screen.getByRole('button', { name: 'Unstar Dune' })).toBeDisabled();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenLastCalledWith(
        'http://localhost:3000/books/book-1/starred',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ starred: true }),
        }
      );
    });
    expect(
      await screen.findByRole('button', { name: 'Unstar Dune' })
    ).not.toBeDisabled();
  });

  it('rolls back an optimistic starred update when the API request fails', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(jsonResponse(books))
      .mockResolvedValueOnce(
        jsonResponse({ error: 'Could not save starred state.' }, false)
      );

    render(<App />);

    const starButton = await screen.findByRole('button', { name: 'Star Dune' });
    fireEvent.click(starButton);

    expect(screen.getByRole('button', { name: 'Unstar Dune' })).toBeDisabled();
    expect(
      await screen.findByRole('button', { name: 'Star Dune' })
    ).not.toBeDisabled();
    expect(
      screen.getByText('Could not save starred state.')
    ).toBeInTheDocument();
  });
});
