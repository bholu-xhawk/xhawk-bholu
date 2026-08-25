import React, { useEffect, useState } from 'react';
import { fetchBooks, updateBookStarred } from '../api/books.js';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingBookId, setUpdatingBookId] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadBooks() {
      try {
        setIsLoading(true);
        setError('');
        const loadedBooks = await fetchBooks();
        if (isCurrent) {
          setBooks(loadedBooks);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || 'Unable to load books.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleToggleStarred(book) {
    try {
      setUpdatingBookId(book.id);
      setError('');
      const updatedBook = await updateBookStarred(book.id, !book.starred);
      setBooks((currentBooks) =>
        currentBooks.map((currentBook) =>
          currentBook.id === updatedBook.id ? updatedBook : currentBook
        )
      );
    } catch (updateError) {
      setError(updateError.message || 'Unable to update starred status.');
    } finally {
      setUpdatingBookId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Books</h1>
        <p className="mt-2 text-gray-600">
          Browse the shared library and keep track of starred books.
        </p>
      </div>

      {isLoading ? <p role="status">Loading books...</p> : null}
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && books.length === 0 ? (
        <p>No books are available yet.</p>
      ) : null}

      {!isLoading && books.length > 0 ? (
        <table
          className="min-w-full border-collapse bg-white shadow"
          aria-label="Books"
        >
          <thead>
            <tr>
              <th className="border px-4 py-2 text-left" scope="col">
                Book name
              </th>
              <th className="border px-4 py-2 text-left" scope="col">
                Authors
              </th>
              <th className="border px-4 py-2 text-left" scope="col">
                Starred
              </th>
              <th className="border px-4 py-2 text-left" scope="col">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <th
                  className="border px-4 py-2 text-left font-medium"
                  scope="row"
                >
                  {book.name}
                </th>
                <td className="border px-4 py-2">{book.authors.join(', ')}</td>
                <td className="border px-4 py-2">
                  {book.starred ? 'Yes' : 'No'}
                </td>
                <td className="border px-4 py-2">
                  <button
                    className="rounded bg-blue-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                    type="button"
                    onClick={() => handleToggleStarred(book)}
                    disabled={updatingBookId === book.id}
                    aria-label={`${book.starred ? 'Unstar' : 'Star'} ${book.name}`}
                  >
                    {updatingBookId === book.id
                      ? 'Saving...'
                      : book.starred
                        ? 'Unstar'
                        : 'Star'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
