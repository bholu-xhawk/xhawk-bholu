import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setStoredToken } from '../api.js';

export default function Login() {
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
      const result = await login({ email, password });
      setStoredToken(result.token);
      navigate('/todos');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-2 text-gray-600">Sign in to manage your private todo list.</p>

      {error ? (
        <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-red-700">
          {error}
        </p>
      ) : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block font-medium" htmlFor="email">Email</label>
          <input
            id="email"
            className="mt-1 w-full rounded border border-gray-300 p-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            className="mt-1 w-full rounded border border-gray-300 p-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
