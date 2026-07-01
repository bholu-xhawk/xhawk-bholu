import React, { useState } from 'react';

export default function AdvancedControls() {
  const [maintenance, setMaintenance] = useState(false);
  const [cacheClearedAt, setCacheClearedAt] = useState(null);

  const toggleMaintenance = () => {
    setMaintenance((m) => !m);
    // TODO: wire to API when available
  };

  const clearCache = () => {
    setCacheClearedAt(new Date());
    // TODO: wire to API when available
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Maintenance Mode</p>
          <p className="text-sm text-gray-600">Temporarily put the site in read-only mode.</p>
        </div>
        <button
          onClick={toggleMaintenance}
          className={`px-4 py-2 rounded text-white ${maintenance ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {maintenance ? 'Disable' : 'Enable'} Maintenance
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Clear Cache</p>
          <p className="text-sm text-gray-600">Purge application caches to refresh content.</p>
        </div>
        <button
          onClick={clearCache}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Clear Cache
        </button>
      </div>

      {cacheClearedAt && (
        <div className="text-sm text-green-700">
          Cache cleared at {cacheClearedAt.toLocaleTimeString()}.
        </div>
      )}
    </div>
  );
}
