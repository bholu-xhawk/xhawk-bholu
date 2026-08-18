import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Booklist from './Booklist.jsx';

const books = [
  {
    id: 1,
    title: 'Kindred',
    author: 'Octavia E. Butler',
    publishedYear: 1979,
    genre: 'Science fiction',
    isbn: '9780807083697',
    description: 'A time-travel novel about ancestry and survival.',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 2,
    title: 'A Wizard of Earthsea',
    author: 'Ursula K. Le Guin',
    publishedYear: null,
    genre: null,
    isbn: null,
    description: null,
    updatedAt: null,
  },
];

function mockFetchOnce(response) {
  globalThis.fetch = jest.fn().mockResolvedValue(response);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <Booklist />
    </MemoryRouter>
  );
}

describe('Booklist', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete globalThis.fetch;
  });

  it('shows a loading state and then renders a table of books with detail links', async () => {
    mockFetchOnce({ ok: true, json: async () => books });

    renderPage();

    expect(screen.getByText(/Loading books/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Booklist/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Title/i })).toBeInTheDocument();
    expect(screen.getByText('Octavia E. Butler')).toBeInTheDocument();
    expect(screen.getByText('Science fiction')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);

    const link = screen.getByRole('link', { name: 'Kindred' });
    expect(link).toHaveAttribute('href', '/booklist/1');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/booklist');
  });

  it('renders an empty state when no books exist', async () => {
    mockFetchOnce({ ok: true, json: async () => [] });

    renderPage();

    expect(await screen.findByText(/No books have been added yet/i)).toBeInTheDocument();
  });

  it('renders an error state when the request fails', async () => {
    mockFetchOnce({ ok: false });

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load books/i);
  });
});
