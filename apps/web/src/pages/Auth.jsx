import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { login } from '../api.js';

export default function Auth({ onAuthenticated = undefined }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      onAuthenticated?.();
      navigate('/todos', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-3xl font-bold">Sign in</h1>
      <p className="mb-4 text-sm text-gray-600">Sign in with your existing account to manage your private todos.</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2"
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}

Auth.propTypes = {
  onAuthenticated: PropTypes.func,
};

