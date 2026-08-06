import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBook, updateBook } from '../api/books.js';

const emptyForm = {
  title: '',
  author: '',
  publishedYear: '',
  description: '',
};

function fieldError(details, field) {
  return details?.fieldErrors?.[field]?.[0];
}

export default function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

    fetchBook(id)
      .then((book) => {
        if (!active) return;
        setForm({
          title: book.title || '',
          author: book.author || '',
          publishedYear: book.publishedYear == null ? '' : String(book.publishedYear),
          description: book.description || '',
        });
      })
      .catch((err) => {
        if (active) setLoadError(err.message || 'Unable to load book');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.author.trim()) errors.author = 'Author is required';
    if (form.publishedYear && !Number.isInteger(Number(form.publishedYear))) {
      errors.publishedYear = 'Published year must be a whole number';
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate();
    setFormErrors(errors);
    setApiError('');
    if (Object.keys(errors).length > 0) return;

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
    };

    setSaving(true);
    try {
      await updateBook(id, payload);
      navigate(`/books/${id}`);
    } catch (err) {
      setFormErrors({
        title: fieldError(err.details, 'title'),
        author: fieldError(err.details, 'author'),
        publishedYear: fieldError(err.details, 'publishedYear'),
        description: fieldError(err.details, 'description'),
      });
      setApiError(err.message || 'Unable to save book');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading book...</p>;

  if (loadError) {
    return (
      <section className="max-w-2xl">
        <h1 className="text-3xl font-bold">Edit book</h1>
        <p role="alert" className="mt-4 text-red-700">{loadError}</p>
      </section>
    );
  }

  return (
    <section className="max-w-2xl">
      <h1 className="text-3xl font-bold">Edit book</h1>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
        {apiError ? <p role="alert" className="text-red-700">{apiError}</p> : null}

        <div>
          <label className="block font-medium" htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            className="mt-1 w-full rounded border p-2"
            value={form.title}
            onChange={handleChange}
            required
          />
          {formErrors.title ? <p className="mt-1 text-sm text-red-700">{formErrors.title}</p> : null}
        </div>

        <div>
          <label className="block font-medium" htmlFor="author">Author</label>
          <input
            id="author"
            name="author"
            className="mt-1 w-full rounded border p-2"
            value={form.author}
            onChange={handleChange}
            required
          />
          {formErrors.author ? <p className="mt-1 text-sm text-red-700">{formErrors.author}</p> : null}
        </div>

        <div>
          <label className="block font-medium" htmlFor="publishedYear">Published year</label>
          <input
            id="publishedYear"
            name="publishedYear"
            type="number"
            min="0"
            className="mt-1 w-full rounded border p-2"
            value={form.publishedYear}
            onChange={handleChange}
          />
          {formErrors.publishedYear ? <p className="mt-1 text-sm text-red-700">{formErrors.publishedYear}</p> : null}
        </div>

        <div>
          <label className="block font-medium" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="mt-1 w-full rounded border p-2"
            rows="5"
            value={form.description}
            onChange={handleChange}
          />
          {formErrors.description ? <p className="mt-1 text-sm text-red-700">{formErrors.description}</p> : null}
        </div>

        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save book'}
        </button>
      </form>
    </section>
  );
}
