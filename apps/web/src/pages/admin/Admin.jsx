import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { getToken } from '../../api/client';

export default function Admin() {
  const token = getToken();
  return (
    <div>
      {!token && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-yellow-800">
          No auth token found. User management requires a valid JWT stored under localStorage key "authToken".
        </div>
      )}
      <div className="mb-4 border-b">
        <nav className="flex gap-4">
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `px-3 py-2 ${isActive ? 'text-blue-700 border-b-2 border-blue-700' : 'text-blue-600 hover:text-blue-800'}`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/admin/monitoring"
            className={({ isActive }) =>
              `px-3 py-2 ${isActive ? 'text-blue-700 border-b-2 border-blue-700' : 'text-blue-600 hover:text-blue-800'}`
            }
          >
            Monitoring
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `px-3 py-2 ${isActive ? 'text-blue-700 border-b-2 border-blue-700' : 'text-blue-600 hover:text-blue-800'}`
            }
          >
            Settings
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
