import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-3xl font-bold">Log in</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span>Email</span>
          <input
            className="mt-1 w-full rounded border p-2"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label className="block">
          <span>Password</span>
          <input
            className="mt-1 w-full rounded border p-2"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error ? <p role="alert" className="text-red-700">{error}</p> : null}
        <button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-4">
        Need an account? <Link className="text-blue-600 hover:underline" to="/signup">Sign up</Link>
      </p>
    </section>
  );
}
