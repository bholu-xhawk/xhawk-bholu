import React, { useState } from 'react';
import { login, signup, storeToken } from '../api.js';

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const email = form.email.trim();
    const password = form.password;
    const name = form.name.trim();

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        await signup({ email, password, ...(name ? { name } : {}) });
      }
      const result = await login({ email, password });
      storeToken(result.token);
      onAuthenticated(result.token);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-2 text-3xl font-bold">{isSignup ? 'Create an account' : 'Log in'}</h1>
      <p className="mb-6 text-gray-600">Sign in to manage your private todo list.</p>

      <div className="mb-4 flex gap-2" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          className={`rounded px-3 py-2 ${!isSignup ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => switchMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`rounded px-3 py-2 ${isSignup ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => switchMode('signup')}
        >
          Sign up
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {isSignup ? (
          <label className="block">
            <span className="mb-1 block font-medium">Name</span>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2"
              name="name"
              value={form.name}
              onChange={updateField}
              autoComplete="name"
            />
          </label>
        ) : null}
        <label className="block">
          <span className="mb-1 block font-medium">Email</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-medium">Password</span>
          <input
            className="w-full rounded border border-gray-300 px-3 py-2"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </label>
        <button
          className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
    </section>
  );
}
