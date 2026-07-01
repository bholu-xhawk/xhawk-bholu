import React, { useMemo, useState } from 'react';
import { users as initialUsers } from '../../mocks/users.js';

const ROLE_OPTIONS = ['user', 'admin', 'superadmin'];

function Badge({ role }) {
  const color = role === 'superadmin' ? 'bg-purple-100 text-purple-800' : role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{role}</span>;
}

export default function PermissionsManager() {
  const [list, setList] = useState(() => initialUsers.map((u) => ({ ...u })));

  const grant = (userId, role) => {
    setList((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      if (!u.roles.includes(role)) {
        return { ...u, roles: [...u.roles, role] };
      }
      return u;
    }));
  };

  const revoke = (userId, role) => {
    setList((prev) => prev.map((u) => {
      if (u.id !== userId) return u;
      return { ...u, roles: u.roles.filter((r) => r !== role) };
    }));
  };

  const usersSorted = useMemo(() => {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [list]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-700">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Roles</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersSorted.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 space-x-1">
                  {u.roles.length ? u.roles.map((r) => <Badge key={r} role={r} />) : <span className="text-gray-400">none</span>}
                </td>
                <td className="px-3 py-2 space-x-2">
                  <div className="inline-flex items-center gap-2">
                    <select className="border rounded px-2 py-1" data-testid={`role-select-${u.id}`} defaultValue="">
                      <option value="" disabled>Grant role…</option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded"
                      onClick={(e) => {
                        const select = e.currentTarget.previousSibling;
                        if (select && select.value) {
                          grant(u.id, select.value);
                          select.value = '';
                        }
                      }}
                    >
                      Grant
                    </button>
                    {u.roles.map((r) => (
                      <button
                        key={`${u.id}-${r}`}
                        className="px-2 py-1 bg-red-600 text-white rounded"
                        onClick={() => revoke(u.id, r)}
                      >
                        Revoke {r}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">All changes are local and not persisted. TODO: wire to API.</p>
    </div>
  );
}
