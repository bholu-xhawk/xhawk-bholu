import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchBook } from '../api/books.js';

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchBook(id)
      .then((data) => {
        if (active) setBook(data);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load book');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p>Loading book...</p>;

  if (error) {
    return (
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold">Book unavailable</h1>
        <p role="alert" className="mt-4 text-red-700">{error}</p>
      </section>
    );
  }

  return (
    <article className="max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{book.title}</h1>
          <p className="text-lg text-gray-700">by {book.author}</p>
        </div>
        <Link className="text-blue-600 hover:underline" to={`/books/${id}/edit`}>Edit</Link>
      </div>

      {book.publishedYear ? <p>Published in {book.publishedYear}</p> : null}
      {book.description ? <p>{book.description}</p> : null}
    </article>
  );
}
