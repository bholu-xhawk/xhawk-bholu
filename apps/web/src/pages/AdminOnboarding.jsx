import React, { useState } from 'react';
import { createAdmin as createAdminApi } from '../mocks/adminApi.js';

export default function AdminOnboarding() {
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  function validate(values) {
    const errs = {};
    // Email required and format check (simple regex)
    if (!values.email) {
      errs.email = 'Email is required';
    } else {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(values.email)) {
        errs.email = 'Enter a valid email address';
      }
    }

    // Password min length
    if (!values.password) {
      errs.password = 'Password is required';
    } else if (values.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    // Confirm password matches
    if (!values.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (values.password && values.confirmPassword !== values.password) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSuccessMessage('');
    setSubmissionError('');

    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = { email: form.email, name: form.name || null, password: form.password };
      const res = await createAdminApi(payload);
      setSuccessMessage(`Admin created successfully for ${res.email}`);
      // reset form
      setForm({ email: '', name: '', password: '', confirmPassword: '' });
      setErrors({});
    } catch (err) {
      setSubmissionError('Something went wrong while creating the admin. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Onboarding</h1>

      {successMessage ? (
        <div className="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-800" role="status">
          {successMessage}
        </div>
      ) : null}

      {/* Validation summary for accessibility */}
      {Object.keys(errors).length > 0 && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700" role="alert" aria-live="assertive">
          Please fix the errors below.
        </div>
      )}

      {submissionError ? (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700" role="alert">
          {submissionError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <label htmlFor="email" className="block font-medium mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="admin@example.com"
            required
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block font-medium mb-1">Name (optional)</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring"
            placeholder="Ada Lovelace"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block font-medium mb-1">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="At least 8 characters"
            required
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block font-medium mb-1">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Re-enter your password"
            required
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50`}
        >
          {isSubmitting ? 'Creating...' : 'Create Admin'}
        </button>
      </form>
    </section>
  );
}
