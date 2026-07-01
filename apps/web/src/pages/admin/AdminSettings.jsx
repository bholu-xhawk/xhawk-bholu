import React from 'react';
import { getApiBase, getToken } from '../../api/client';

function maskToken(token) {
  if (!token) return '';
  if (token.length <= 8) return token.replace(/.(?=.{0})/g, '*');
  const start = token.slice(0, 4);
  const end = token.slice(-4);
  const middle = '*'.repeat(Math.max(0, token.length - 8));
  return `${start}${middle}${end}`;
}

export default function AdminSettings() {
  const apiBase = getApiBase();
  const token = getToken();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Settings</h2>
      <div className="rounded border bg-white p-4 shadow">
        <div className="mb-2">
          <div className="text-sm text-gray-500">Resolved API base URL</div>
          <div className="text-gray-800">{apiBase}</div>
        </div>
        <div className="mb-2">
          <div className="text-sm text-gray-500">Auth token (localStorage key "authToken")</div>
          <div className="text-gray-800">{token ? `Present: ${maskToken(token)}` : 'Absent'}</div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Tokens are read from localStorage. A login flow can be added later; for now, set it manually in the console: localStorage.setItem('authToken', '&lt;jwt&gt;').
        </div>
      </div>
    </div>
  );
}
