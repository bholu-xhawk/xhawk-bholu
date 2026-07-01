import React, { useEffect, useMemo, useState } from 'react';

const SAMPLE_USERS = [
  { id: 1, name: 'Alice Example', email: 'alice@example.com' },
  { id: 2, name: 'Bob Example', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Example', email: 'charlie@example.com' },
];

const ROLES = ['Viewer', 'Admin', 'Super Admin'];

export default function PermissionsTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [roles, setRoles] = useState({}); // { [userId]: role }
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.users || [];
        if (isMounted) {
          const filled = arr;
          setUsers(filled);
          // initialize roles to Viewer by default
          const initial = {};
          filled.forEach((u) => {
            initial[u.id] = 'Viewer';
          });
          setRoles(initial);
        }
      } catch (e) {
        if (isMounted) {
          setError('Failed to load users, showing sample data.');
          setUsers(SAMPLE_USERS);
          const initial = {};
          SAMPLE_USERS.forEach((u) => {
            initial[u.id] = 'Viewer';
          });
          setRoles(initial);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return users;
    const f = filter.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase()?.includes(f) || u.email?.toLowerCase()?.includes(f)
    );
  }, [users, filter]);

  const onRoleChange = (userId, role) => {
    setRoles((prev) => ({ ...prev, [userId]: role }));
    setNotice('Role changes are not yet persisted. This is a UI-only preview.');
  };

  if (loading) return <div>Loading users…</div>;

  return (
    <div>
      {error && (
        <div role="alert" className="mb-3 text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <input
          aria-label="Search users"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by name or email"
          className="border rounded px-3 py-2 w-full max-w-md"
        />
      </div>

      {notice && (
        <div data-testid="notice" className="mb-3 text-sm text-blue-800 bg-blue-50 p-2 rounded">
          {notice}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{u.name || '—'}</td>
                <td className="p-3 whitespace-nowrap text-gray-600">{u.email || '—'}</td>
                <td className="p-3">
                  <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.name || u.email}</label>
                  <select
                    id={`role-${u.id}`}
                    aria-label={`Role for ${u.name || u.email}`}
                    className="border rounded px-2 py-1"
                    value={roles[u.id] || 'Viewer'}
                    onChange={(e) => onRoleChange(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Note: A future backend update will persist these role selections. For now, they affect only the current view.
      </p>
    </div>
  );
}
