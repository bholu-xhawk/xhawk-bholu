import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../api.js';

export default function Auth({ onAuthenticated = () => {} }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isSignup = mode === 'signup';

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError('');
    try {
      const credentials = { email, password };
      if (isSignup) await signup(credentials);
      await login(credentials);
      onAuthenticated();
      navigate('/todos');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-3xl font-bold">{isSignup ? 'Sign up' : 'Log in'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium" htmlFor="email">Email</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2"
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            required
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="password">Password</label>
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2"
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={pending}
            required
          />
        </div>
        {error ? <p role="alert" className="text-red-700">{error}</p> : null}
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
          type="submit"
          disabled={pending}
        >
          {pending ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>
      </form>
      <button
        className="mt-4 text-blue-600 hover:underline disabled:text-gray-500"
        type="button"
        onClick={() => {
          setMode(isSignup ? 'login' : 'signup');
          setError('');
        }}
        disabled={pending}
      >
        {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
      </button>
    </section>
  );
}

Auth.propTypes = {
  onAuthenticated: PropTypes.func,
};
