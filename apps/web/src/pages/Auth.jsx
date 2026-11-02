import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, signup } from '../api.js';

export default function Auth({ onLogin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(location.pathname === '/signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const isSignup = mode === 'signup';

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    navigate(nextMode === 'signup' ? '/signup' : '/login', { replace: true });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!form.password) {
      setError('Password is required.');
      return;
    }
    if (isSignup && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setPending(true);
    try {
      const token = isSignup
        ? await signup({ email: form.email.trim(), password: form.password, name: form.name.trim() })
        : await login(form.email.trim(), form.password);
      onLogin(token);
      navigate('/todos', { replace: true });
    } catch (apiError) {
      setError(apiError.message || 'Authentication failed.');
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
            id="email"
            name="email"
            type="email"
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.email}
            onChange={updateField}
            disabled={pending}
          />
        </div>
        {isSignup ? (
          <div>
            <label className="block font-medium" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.name}
              onChange={updateField}
              disabled={pending}
            />
          </div>
        ) : null}
        <div>
          <label className="block font-medium" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            value={form.password}
            onChange={updateField}
            disabled={pending}
          />
        </div>
        {error ? <p role="alert" className="rounded bg-red-50 p-3 text-red-700">{error}</p> : null}
        <button className="rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
        <button className="text-blue-600 hover:underline" type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
          {isSignup ? 'Log in' : 'Sign up'}
        </button>
      </p>
      <p className="mt-2 text-sm"><Link className="text-blue-600 hover:underline" to="/">Back home</Link></p>
    </section>
  );
}
