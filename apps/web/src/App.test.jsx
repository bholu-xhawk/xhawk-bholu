import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { fetchBooks, updateBookStarred } from './api/books.js';

jest.mock('./api/books.js', () => ({
  BOOKS_API_BASE_URL: 'http://localhost:3001/api',
  fetchBooks: jest.fn(),
  updateBookStarred: jest.fn(),
}));

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

const dune = {
  id: '1',
  name: 'Dune',
  details: 'A desert planet epic',
  authors: 'Frank Herbert',
  starred: false,
};

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Table Of Book navigation and loading state while books load', () => {
    fetchBooks.mockReturnValue(new Promise(() => {}));

    renderApp();

    expect(screen.getAllByText(/Table Of Book/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Books/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Loading books/i);
  });

  it('loads and renders fetched books', async () => {
    fetchBooks.mockResolvedValue([dune]);

    renderApp();

    expect(
      await screen.findByRole('rowheader', { name: 'Dune' })
    ).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
  });

  it('shows an empty state when no books are returned', async () => {
    fetchBooks.mockResolvedValue([]);

    renderApp();

    expect(
      await screen.findByText(/No books are available yet/i)
    ).toBeInTheDocument();
  });

  it('shows an error state and retries loading books', async () => {
    fetchBooks
      .mockRejectedValueOnce(new Error('Backend unavailable'))
      .mockResolvedValueOnce([dune]);

    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Backend unavailable'
    );

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    expect(
      await screen.findByRole('rowheader', { name: 'Dune' })
    ).toBeInTheDocument();
    expect(fetchBooks).toHaveBeenCalledTimes(2);
  });

  it('optimistically stars a book and keeps the updated server result', async () => {
    const update = deferred();
    fetchBooks.mockResolvedValue([dune]);
    updateBookStarred.mockReturnValue(update.promise);

    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: /Star Dune/i }));

    expect(
      screen.getByRole('button', { name: /Unstar Dune/i })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(updateBookStarred).toHaveBeenCalledWith('1', true);

    await act(async () => {
      update.resolve({ ...dune, starred: true });
      await update.promise;
    });

    expect(
      screen.getByRole('button', { name: /Unstar Dune/i })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('rolls back an optimistic star change when the API update fails', async () => {
    fetchBooks.mockResolvedValue([dune]);
    updateBookStarred.mockRejectedValue(new Error('Could not save star'));

    renderApp();

    fireEvent.click(await screen.findByRole('button', { name: /Star Dune/i }));

    expect(
      screen.getByRole('button', { name: /Unstar Dune/i })
    ).toHaveAttribute('aria-pressed', 'true');

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Star Dune/i })
      ).toHaveAttribute('aria-pressed', 'false')
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save star');
  });
});
