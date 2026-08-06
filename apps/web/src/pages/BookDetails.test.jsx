import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BookDetails from './BookDetails.jsx';

function mockJsonResponse(body, init = {}) {
  return Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function renderBookDetails(path = '/books/42') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/books/:id" element={<BookDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BookDetails', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('renders loading state and then book details', async () => {
    global.fetch = jest.fn(() =>
      mockJsonResponse({
        id: 42,
        title: 'Parable of the Sower',
        author: 'Octavia E. Butler',
        description: 'A near-future novel.',
        publishedYear: 1993,
      })
    );

    renderBookDetails();

    expect(screen.getByText(/Loading book/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Parable of the Sower/i })).toBeInTheDocument();
    expect(screen.getByText(/by Octavia E. Butler/i)).toBeInTheDocument();
    expect(screen.getByText(/Published in 1993/i)).toBeInTheDocument();
    expect(screen.getByText(/A near-future novel/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Edit/i })).toHaveAttribute('href', '/books/42/edit');
  });

  it('renders an API error message', async () => {
    global.fetch = jest.fn(() => mockJsonResponse({ error: 'Book not found' }, { ok: false, status: 404 }));

    renderBookDetails();

    expect(await screen.findByRole('heading', { name: /Book unavailable/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Book not found');
  });
});
