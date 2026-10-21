import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await signup(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded bg-white p-6 shadow">
      <h1 className="mb-4 text-3xl font-bold">Sign up</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span>Name</span>
          <input
            className="mt-1 w-full rounded border p-2"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
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
            minLength={8}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error ? <p role="alert" className="text-red-700">{error}</p> : null}
        <button className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4">
        Already have an account? <Link className="text-blue-600 hover:underline" to="/login">Log in</Link>
      </p>
    </section>
  );
}
