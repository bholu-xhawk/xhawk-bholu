import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { login, signup } from '../api.js';

export default function AuthForm({ onAuthenticated, message = '' }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setPending(true);

    try {
      if (mode === 'signup') {
        await signup({ email, password, name });
      }
      const result = await login({ email, password });
      onAuthenticated(result.token);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setPending(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow" aria-labelledby="auth-heading">
      <h1 id="auth-heading" className="text-3xl font-bold text-gray-950">Todo list</h1>
      <p className="mt-2 text-sm text-gray-600">Sign in to manage your private todos.</p>
      {message ? <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">{message}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {isSignup ? (
          <label className="block text-sm font-medium text-gray-700">
            Name
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </label>
        ) : null}

        <label className="block text-sm font-medium text-gray-700">
          Email
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Password
          <input
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={isSignup ? 8 : 1}
          />
        </label>

        <button
          className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>

      <button
        className="mt-4 text-sm font-medium text-blue-700 hover:underline"
        type="button"
        onClick={() => {
          setError('');
          setMode(isSignup ? 'login' : 'signup');
        }}
        disabled={pending}
      >
        {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
      </button>
    </section>
  );
}

AuthForm.propTypes = {
  onAuthenticated: PropTypes.func.isRequired,
  message: PropTypes.string,
};

