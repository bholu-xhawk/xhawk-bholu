import React from 'react';
import SettingsPanel from '../components/SuperAdmin/SettingsPanel.jsx';
import PermissionsTable from '../components/SuperAdmin/PermissionsTable.jsx';
import useLocalStorage from '../hooks/useLocalStorage.js';

export default function SuperAdmin() {
  const [maintenance, setMaintenance] = useLocalStorage('settings:maintenance', false);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Super Admin</h1>
        <p className="text-gray-700">Advanced controls and system-wide configuration</p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Advanced Controls</h2>
        <div className="space-y-3">
          <label className="inline-flex items-center gap-2">
            <input
              aria-label="Super admin maintenance toggle"
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
            />
            <span>Maintenance mode (UI stub)</span>
          </label>
          <div>
            <button
              type="button"
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              onClick={() => alert('Cache clear requested (stub).')}
            >
              Clear cache (stub)
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Permissions Management</h2>
        <PermissionsTable />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">System-wide Settings</h2>
        <SettingsPanel />
      </section>
    </div>
  );
}
