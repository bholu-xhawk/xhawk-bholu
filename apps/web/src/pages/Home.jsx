import React, { useCallback, useEffect, useState } from 'react';
import {
  BOOKS_API_BASE_URL,
  fetchBooks,
  updateBookStarred,
} from '../api/books.js';
import BookTable from '../components/BookTable.jsx';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [updatingBookIds, setUpdatingBookIds] = useState(() => new Set());

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    setActionError('');

    try {
      const fetchedBooks = await fetchBooks();
      setBooks(fetchedBooks);
    } catch (error) {
      setLoadError(error.message || 'Unable to load books.');
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  async function handleToggleStar(book) {
    const nextStarred = !book.starred;
    const previousBooks = books;

    setActionError('');
    setUpdatingBookIds((current) => new Set(current).add(book.id));
    setBooks((currentBooks) =>
      currentBooks.map((currentBook) =>
        currentBook.id === book.id
          ? { ...currentBook, starred: nextStarred }
          : currentBook
      )
    );

    try {
      const updatedBook = await updateBookStarred(book.id, nextStarred);
      setBooks((currentBooks) =>
        currentBooks.map((currentBook) =>
          currentBook.id === updatedBook.id ? updatedBook : currentBook
        )
      );
    } catch (error) {
      setBooks(previousBooks);
      setActionError(
        error.message || 'Unable to update the starred state. Please try again.'
      );
    } finally {
      setUpdatingBookIds((current) => {
        const next = new Set(current);
        next.delete(book.id);
        return next;
      });
    }
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Table Of Book
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">
          Table Of Book
        </h1>
        <p className="max-w-2xl text-gray-600">
          Browse books from the backend service and mark favorites without
          losing your place.
        </p>
        <p className="text-sm text-gray-500">
          API origin: {BOOKS_API_BASE_URL}
        </p>
      </div>

      {isLoading ? (
        <div
          className="rounded-xl border border-blue-100 bg-blue-50 p-6 text-blue-900"
          role="status"
        >
          Loading books…
        </div>
      ) : loadError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900"
          role="alert"
        >
          <h2 className="text-lg font-semibold">Unable to load books</h2>
          <p className="mt-2">{loadError}</p>
          <button
            type="button"
            onClick={loadBooks}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
          No books are available yet.
        </div>
      ) : (
        <>
          {actionError ? (
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900"
              role="alert"
            >
              {actionError}
            </div>
          ) : null}
          <BookTable
            books={books}
            onToggleStar={handleToggleStar}
            updatingBookIds={updatingBookIds}
          />
        </>
      )}
    </section>
  );
}
