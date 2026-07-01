import React from 'react';
import AdvancedControls from '../components/SuperAdmin/AdvancedControls.jsx';
import PermissionsManager from '../components/SuperAdmin/PermissionsManager.jsx';
import SystemSettings from '../components/SuperAdmin/SystemSettings.jsx';

export default function SuperAdminPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Super Admin</h1>
        <p className="text-gray-600 mt-1">
          This area is for super administrators and is distinct from the regular admin view.
          It exposes elevated controls and global settings. All actions are currently UI-only.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Advanced Controls</h2>
        <AdvancedControls />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">Permissions Manager</h2>
        <PermissionsManager />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">System Settings</h2>
        <SystemSettings />
      </section>
    </div>
  );
}
