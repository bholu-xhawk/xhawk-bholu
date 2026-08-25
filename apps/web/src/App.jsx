import React, { useEffect, useState } from 'react';

/* global __BOOKS_API_URL__ */
const DEFAULT_API_URL = 'http://localhost:3000';
const configuredApiUrl =
  typeof __BOOKS_API_URL__ !== 'undefined'
    ? __BOOKS_API_URL__
    : globalThis.process?.env?.VITE_BOOKS_API_URL;
const BOOKS_API_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/$/, '');

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Request failed');
  }

  return payload;
}

function formatAuthors(authors) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return 'Unknown author';
  }

  return authors.join(', ');
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toggleError, setToggleError] = useState('');
  const [savingBookIds, setSavingBookIds] = useState(new Set());

  useEffect(() => {
    let isMounted = true;

    async function fetchBooks() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${BOOKS_API_URL}/books`);
        const data = await readJsonResponse(response);
        if (isMounted) {
          setBooks(data);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(error.message || 'Unable to load books.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBooks();

    return () => {
      isMounted = false;
    };
  }, []);

  async function toggleStarred(book) {
    const nextStarred = !book.starred;
    const previousBooks = books;

    setToggleError('');
    setSavingBookIds((currentIds) => new Set(currentIds).add(book.id));
    setBooks((currentBooks) =>
      currentBooks.map((currentBook) =>
        currentBook.id === book.id
          ? { ...currentBook, starred: nextStarred }
          : currentBook
      )
    );

    try {
      const response = await fetch(
        `${BOOKS_API_URL}/books/${book.id}/starred`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ starred: nextStarred }),
        }
      );
      const updatedBook = await readJsonResponse(response);

      setBooks((currentBooks) =>
        currentBooks.map((currentBook) =>
          currentBook.id === updatedBook.id ? updatedBook : currentBook
        )
      );
    } catch (error) {
      setBooks(previousBooks);
      setToggleError(error.message || `Could not update ${book.name}.`);
    } finally {
      setSavingBookIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(book.id);
        return nextIds;
      });
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Library
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Book table</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Browse the backend book catalog and mark favorites with the starred
            toggle.
          </p>
        </div>

        {loadError ? (
          <div className="status-message status-message--error">
            {loadError}
          </div>
        ) : null}
        {toggleError ? (
          <div className="status-message status-message--error">
            {toggleError}
          </div>
        ) : null}
        {isLoading ? (
          <div className="status-message">Loading books…</div>
        ) : null}

        {!isLoading && !loadError ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="book-table">
              <thead>
                <tr>
                  <th scope="col">Book Name</th>
                  <th scope="col">Details</th>
                  <th scope="col">Authors</th>
                  <th scope="col">Starred</th>
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td className="empty-state" colSpan="4">
                      No books yet. Add a book through the API to see it here.
                    </td>
                  </tr>
                ) : (
                  books.map((book) => {
                    const isSaving = savingBookIds.has(book.id);
                    return (
                      <tr key={book.id}>
                        <td className="font-semibold text-slate-950">
                          {book.name}
                        </td>
                        <td>{book.details}</td>
                        <td>{formatAuthors(book.authors)}</td>
                        <td>
                          <button
                            aria-label={
                              book.starred
                                ? `Unstar ${book.name}`
                                : `Star ${book.name}`
                            }
                            className="star-button"
                            disabled={isSaving}
                            onClick={() => toggleStarred(book)}
                            type="button"
                          >
                            <span aria-hidden="true">
                              {book.starred ? '★' : '☆'}
                            </span>
                            <span>
                              {book.starred ? 'Starred' : 'Not starred'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
