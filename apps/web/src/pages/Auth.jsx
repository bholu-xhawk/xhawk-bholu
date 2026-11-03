import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { apiRequest, storeToken } from '../lib/api.js';

const initialForm = { email: '', password: '', name: '' };

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await apiRequest('/api/auth/signup', {
          method: 'POST',
          body: {
            email: form.email,
            password: form.password,
            name: form.name.trim() || undefined,
          },
        });
      }

      const login = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: form.email, password: form.password },
      });

      storeToken(login.token);
      onAuthenticated(login.token);
    } catch (apiError) {
      setError(apiError.message || 'Unable to authenticate');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="text-3xl font-bold">{isSignup ? 'Create your account' : 'Log in'}</h1>
      <p className="mt-2 text-sm text-gray-600">Sign in to manage your private todo list.</p>

      <div className="mt-6 flex gap-2" aria-label="Authentication mode">
        <button
          type="button"
          className={`rounded px-3 py-2 ${!isSignup ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => switchMode('login')}
        >
          Log in
        </button>
        <button
          type="button"
          className={`rounded px-3 py-2 ${isSignup ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => switchMode('signup')}
        >
          Sign up
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <form aria-label="Authentication form" className="mt-6 space-y-4" onSubmit={submit}>
        {isSignup ? (
          <label className="block text-sm font-medium text-gray-700">
            Name
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              name="name"
              value={form.name}
              onChange={updateField}
              autoComplete="name"
            />
          </label>
        ) : null}

        <label className="block text-sm font-medium text-gray-700">
          Email
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            required
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Password
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
          />
        </label>

        <button
          className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>
      </form>
    </section>
  );
}

Auth.propTypes = {
  onAuthenticated: PropTypes.func.isRequired,
};
