import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BookDetails from './BookDetails.jsx';

const book = {
  id: 1,
  title: 'Kindred',
  author: 'Octavia E. Butler',
  publishedYear: 1979,
  genre: 'Science fiction',
  isbn: '9780807083697',
  description: 'A time-travel novel about ancestry and survival.',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

function renderPage(path = '/booklist/1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/booklist/:id" element={<BookDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BookDetails', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete globalThis.fetch;
  });

  it('fetches and renders full metadata for a book', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => book });

    renderPage();

    expect(screen.getByText(/Loading book details/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Kindred' })).toBeInTheDocument();
    expect(screen.getByText(/by Octavia E. Butler/i)).toBeInTheDocument();
    expect(screen.getByText('1979')).toBeInTheDocument();
    expect(screen.getByText('Science fiction')).toBeInTheDocument();
    expect(screen.getByText('9780807083697')).toBeInTheDocument();
    expect(screen.getByText(/ancestry and survival/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to booklist/i })).toHaveAttribute('href', '/booklist');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/booklist/1');
  });

  it('rejects invalid route ids before fetching', async () => {
    globalThis.fetch = jest.fn();

    renderPage('/booklist/not-a-number');

    expect(await screen.findByRole('alert')).toHaveTextContent(/Invalid book id/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('renders a not-found state for 404 responses', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Book not found/i);
  });

  it('renders an error state when the request fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network failed'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Unable to load book details/i);
  });
});
