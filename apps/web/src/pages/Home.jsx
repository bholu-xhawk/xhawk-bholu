import React, { useEffect, useState } from 'react';

export default function Home() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadBooks() {
      try {
        const response = await fetch('/api/books');
        if (!response.ok) {
          throw new Error('Failed to load books');
        }
        const data = await response.json();
        if (isMounted) {
          setBooks(data);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load the booklist. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadBooks();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Booklist</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Booklist</h1>
        <p className="mt-2 text-gray-600">Browse a small catalog served by the API.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading && <p className="p-6 text-gray-600">Loading books...</p>}

        {!isLoading && error && (
          <p role="alert" className="p-6 text-red-700">
            {error}
          </p>
        )}

        {!isLoading && !error && (
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead className="bg-gray-100 text-sm uppercase tracking-wide text-gray-600">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Title</th>
                <th scope="col" className="px-6 py-3 font-semibold">Author</th>
                <th scope="col" className="px-6 py-3 font-semibold">Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {books.map((book) => (
                <tr key={book.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{book.title}</td>
                  <td className="px-6 py-4">{book.author}</td>
                  <td className="px-6 py-4">{book.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
