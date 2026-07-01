import React, { useState } from 'react';

export default function SystemSettings() {
  const [siteName, setSiteName] = useState('My App');
  const [maxSessionMinutes, setMaxSessionMinutes] = useState(60);
  const [status, setStatus] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: wire to API when available
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1500);
  };

  return (
    <form onSubmit={onSubmit} className="p-4 bg-white rounded shadow space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Site Name</label>
        <input
          type="text"
          className="border rounded px-3 py-2 w-full"
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Max Session Length (minutes)</label>
        <input
          type="number"
          className="border rounded px-3 py-2 w-full"
          value={maxSessionMinutes}
          onChange={(e) => setMaxSessionMinutes(parseInt(e.target.value || '0', 10))}
        />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        {status && <span className="text-green-700 text-sm" role="status">{status}</span>}
      </div>
      <p className="text-xs text-gray-500">These settings are local only. TODO: persist via API.</p>
    </form>
  );
}
