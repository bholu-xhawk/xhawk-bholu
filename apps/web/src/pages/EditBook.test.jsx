import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditBook from './EditBook.jsx';

function mockJsonResponse(body, init = {}) {
  return Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

const seededBook = {
  id: 42,
  title: 'A Wizard of Earthsea',
  author: 'Ursula K. Le Guin',
  description: 'A fantasy classic.',
  publishedYear: 1968,
};

function renderEditBook() {
  return render(
    <MemoryRouter initialEntries={['/books/42/edit']}>
      <Routes>
        <Route path="/books/:id/edit" element={<EditBook />} />
        <Route path="/books/:id" element={<h1>Book details route</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EditBook', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('loads a book and prefills the edit form', async () => {
    global.fetch = jest.fn(() => mockJsonResponse(seededBook));

    renderEditBook();

    expect(screen.getByText(/Loading book/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Edit book/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toHaveValue('A Wizard of Earthsea');
    expect(screen.getByLabelText(/Author/i)).toHaveValue('Ursula K. Le Guin');
    expect(screen.getByLabelText(/Published year/i)).toHaveValue(1968);
    expect(screen.getByLabelText(/Description/i)).toHaveValue('A fantasy classic.');
  });

  it('prevents submitting when required fields are empty', async () => {
    global.fetch = jest.fn(() => mockJsonResponse(seededBook));

    renderEditBook();

    const title = await screen.findByLabelText(/Title/i);
    fireEvent.change(title, { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: /Save book/i }).closest('form'));

    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('submits updates and navigates back to details', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => mockJsonResponse(seededBook))
      .mockImplementationOnce(() => mockJsonResponse({ ...seededBook, title: 'The Tombs of Atuan' }));

    renderEditBook();

    const title = await screen.findByLabelText(/Title/i);
    fireEvent.change(title, { target: { value: 'The Tombs of Atuan' } });
    fireEvent.click(screen.getByRole('button', { name: /Save book/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(global.fetch).toHaveBeenLastCalledWith(
      'http://localhost:3001/api/books/42',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          title: 'The Tombs of Atuan',
          author: 'Ursula K. Le Guin',
          description: 'A fantasy classic.',
          publishedYear: 1968,
        }),
      })
    );
    expect(await screen.findByRole('heading', { name: /Book details route/i })).toBeInTheDocument();
  });

  it('displays API errors from failed saves', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => mockJsonResponse(seededBook))
      .mockImplementationOnce(() => mockJsonResponse({ error: 'Failed to update book' }, { ok: false, status: 500 }));

    renderEditBook();

    await screen.findByLabelText(/Title/i);
    fireEvent.click(screen.getByRole('button', { name: /Save book/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to update book');
  });
});
