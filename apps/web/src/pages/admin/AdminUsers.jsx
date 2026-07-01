import React, { useEffect, useState } from 'react';
import { UsersAPI, getToken } from '../../api/client';

function formatDate(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch (e) {
    return String(dt);
  }
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', name: '', password: '' });
  const [actionError, setActionError] = useState(null);

  const tokenPresent = !!getToken();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const list = await UsersAPI.list();
      setUsers(list || []);
    } catch (e) {
      setError(e.payload?.error || e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onCreateChange(e) {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitCreate(e) {
    e.preventDefault();
    setActionError(null);
    if (!tokenPresent) {
      setActionError('Token required to create users');
      return;
    }
    if (!createForm.email || !createForm.password) {
      setActionError('Email and password are required');
      return;
    }
    if (createForm.password.length < 8) {
      setActionError('Password must be at least 8 characters');
      return;
    }
    try {
      await UsersAPI.create({
        email: createForm.email,
        name: createForm.name || undefined,
        password: createForm.password,
      });
      setCreating(false);
      setCreateForm({ email: '', name: '', password: '' });
      await load();
    } catch (e) {
      setActionError(e.payload?.error || e.message || 'Failed to create user');
    }
  }

  function Row({ user }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ email: user.email || '', name: user.name || '', password: '' });
    const [rowError, setRowError] = useState(null);

    function onChange(e) {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function save() {
      setRowError(null);
      if (!tokenPresent) {
        setRowError('Token required to update users');
        return;
      }
      const payload = {};
      if (form.email && form.email !== user.email) payload.email = form.email;
      if (form.name !== user.name) payload.name = form.name || null;
      if (form.password) {
        if (form.password.length < 8) {
          setRowError('Password must be at least 8 characters');
          return;
        }
        payload.password = form.password;
      }
      try {
        await UsersAPI.update(user.id, payload);
        setEditing(false);
        await load();
      } catch (e) {
        setRowError(e.payload?.error || e.message || 'Failed to update user');
      }
    }

    async function remove() {
      setRowError(null);
      if (!tokenPresent) {
        setRowError('Token required to delete users');
        return;
      }
      if (!window.confirm('Delete this user?')) return;
      try {
        await UsersAPI.remove(user.id);
        await load();
      } catch (e) {
        setRowError(e.payload?.error || e.message || 'Failed to delete user');
      }
    }

    return (
      <tr className="border-b">
        <td className="p-2 text-gray-700">{user.id}</td>
        <td className="p-2">
          {editing ? (
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              className="w-full rounded border p-1"
              type="email"
            />
          ) : (
            <span>{user.email}</span>
          )}
        </td>
        <td className="p-2">
          {editing ? (
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className="w-full rounded border p-1"
            />
          ) : (
            <span>{user.name || '-'}</span>
          )}
        </td>
        <td className="p-2 text-gray-600">{formatDate(user.createdAt)}</td>
        <td className="p-2">
          {editing ? (
            <input
              name="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded border p-1"
              type="password"
              placeholder="(optional) new password"
            />
          ) : null}
          {rowError && <div className="mt-2 text-sm text-red-600">{rowError}</div>}
        </td>
        <td className="p-2">
          {editing ? (
            <div className="flex gap-2">
              <button
                className="rounded bg-blue-600 px-3 py-1 text-white disabled:bg-gray-300"
                onClick={save}
                disabled={!tokenPresent}
              >
                Save
              </button>
              <button
                className="rounded bg-gray-200 px-3 py-1"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                className="rounded bg-blue-600 px-3 py-1 text-white disabled:bg-gray-300"
                onClick={() => setEditing(true)}
                disabled={!tokenPresent}
              >
                Edit
              </button>
              <button
                className="rounded bg-red-600 px-3 py-1 text-white disabled:bg-gray-300"
                onClick={remove}
                disabled={!tokenPresent}
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div>
      {!tokenPresent && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          No auth token found. Listing may fail with 401. Create, edit, and delete are disabled until a token is present.
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        <button
          className="rounded bg-green-600 px-3 py-1 text-white disabled:bg-gray-300"
          onClick={() => setCreating((v) => !v)}
          disabled={!tokenPresent}
        >
          New User
        </button>
      </div>

      {creating && (
        <form onSubmit={submitCreate} className="mb-4 rounded border bg-white p-4 shadow">
          <div className="mb-2">
            <label className="block text-sm text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={createForm.email}
              onChange={onCreateChange}
              className="mt-1 w-full rounded border p-2"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm text-gray-700">Name (optional)</label>
            <input
              name="name"
              value={createForm.name}
              onChange={onCreateChange}
              className="mt-1 w-full rounded border p-2"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              value={createForm.password}
              onChange={onCreateChange}
              className="mt-1 w-full rounded border p-2"
              required
              minLength={8}
            />
          </div>
          {actionError && <div className="mb-2 text-sm text-red-600">{actionError}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-green-600 px-3 py-1 text-white disabled:bg-gray-300"
              disabled={!tokenPresent}
            >
              Create
            </button>
            <button type="button" className="rounded bg-gray-200 px-3 py-1" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded border bg-white shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Actions</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4" colSpan={6}>Loading…</td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-4 text-red-600" colSpan={6}>{error}</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="p-4" colSpan={6}>No users found</td>
              </tr>
            ) : (
              users.map((u) => <Row key={u.id} user={u} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
