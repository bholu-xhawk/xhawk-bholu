import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function formatValue(value) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

export default function Booklist() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      try {
        const response = await fetch('/api/booklist');
        if (!response.ok) throw new Error('Unable to load books');
        const data = await response.json();
        if (active) setBooks(data);
      } catch (err) {
        if (active) setError('Unable to load books. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBooks();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="text-gray-600">Loading books…</p>;

  if (error) {
    return (
      <div role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Booklist</h1>
        <p className="mt-2 text-gray-600">Browse saved books and open a title to see its full metadata.</p>
      </div>

      {books.length === 0 ? (
        <p className="rounded border border-dashed border-gray-300 bg-white p-6 text-gray-600">No books have been added yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">ISBN</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book.id} className="align-top hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link className="text-blue-600 hover:underline" to={`/booklist/${book.id}`}>
                      {book.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{book.author}</td>
                  <td className="px-4 py-3">{formatValue(book.publishedYear)}</td>
                  <td className="px-4 py-3">{formatValue(book.genre)}</td>
                  <td className="px-4 py-3">{formatValue(book.isbn)}</td>
                  <td className="max-w-xs px-4 py-3 text-gray-600">{formatValue(book.description)}</td>
                  <td className="px-4 py-3">{formatDate(book.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
