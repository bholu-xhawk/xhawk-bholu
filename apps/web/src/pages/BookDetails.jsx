import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

function isValidId(id) {
  const number = Number(id);
  return Number.isInteger(number) && number > 0;
}

function formatValue(value) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function renderDetailRow(label, value) {
  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <dt className="text-sm font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-900">{value}</dd>
    </div>
  );
}

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(() => isValidId(id));
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isValidId(id)) {
      setLoading(false);
      setError('Invalid book id.');
      return;
    }

    let active = true;

    async function loadBook() {
      try {
        const response = await fetch(`/api/booklist/${id}`);
        if (response.status === 404) {
          if (active) setNotFound(true);
          return;
        }
        if (!response.ok) throw new Error('Unable to load book');
        const data = await response.json();
        if (active) setBook(data);
      } catch (err) {
        if (active) setError('Unable to load book details. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBook();

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <section className="space-y-4">
      <Link className="text-blue-600 hover:underline" to="/booklist">
        ← Back to booklist
      </Link>

      {loading && <p className="text-gray-600">Loading book details…</p>}

      {!loading && error && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && notFound && (
        <div role="alert" className="rounded border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Book not found.
        </div>
      )}

      {!loading && book && (
        <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="mt-2 text-lg text-gray-600">by {book.author}</p>
          </div>
          <dl className="mt-4">
            {renderDetailRow('Publication year', formatValue(book.publishedYear))}
            {renderDetailRow('Genre', formatValue(book.genre))}
            {renderDetailRow('ISBN', formatValue(book.isbn))}
            {renderDetailRow('Description', formatValue(book.description))}
            {renderDetailRow('Created', formatDate(book.createdAt))}
            {renderDetailRow('Updated', formatDate(book.updatedAt))}
          </dl>
        </article>
      )}
    </section>
  );
}
