import React from 'react';

export default function RoleGuard({ requiredRole, children }) {
  const role = typeof window !== 'undefined' ? window.localStorage.getItem('role') : null;
  const allowed = role === requiredRole;

  if (allowed) return <>{children}</>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
      <p className="text-gray-700 mb-4">
        You do not have sufficient permissions to view this page.
      </p>
      <p className="text-gray-600 text-sm">
        This is a development-only guard. To demo the Super Admin view, set
        <code className="px-1 py-0.5 bg-gray-100 border rounded mx-1">localStorage.role = '{requiredRole}'</code>
        in your browser console and reload.
      </p>
    </div>
  );
}
