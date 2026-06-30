import React from 'react';
import useLocalStorage from '../../hooks/useLocalStorage.js';

export default function SettingsPanel() {
  const [maintenance, setMaintenance] = useLocalStorage('settings:maintenance', false);
  const [enableRegistrations, setEnableRegistrations] = useLocalStorage('settings:enableRegistrations', true);
  const [require2FA, setRequire2FA] = useLocalStorage('settings:require2FA', false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-white rounded shadow">
        <div>
          <h3 className="text-lg font-semibold">Maintenance mode</h3>
          <p className="text-sm text-gray-600">Temporarily disable user access while performing maintenance.</p>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input aria-label="Maintenance mode" type="checkbox" className="sr-only peer" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute relative after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded shadow">
        <div>
          <h3 className="text-lg font-semibold">Enable registrations</h3>
          <p className="text-sm text-gray-600">Allow new users to sign up for accounts.</p>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={enableRegistrations} onChange={(e) => setEnableRegistrations(e.target.checked)} />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute relative after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-white rounded shadow">
        <div>
          <h3 className="text-lg font-semibold">Require 2FA</h3>
          <p className="text-sm text-gray-600">Require two-factor authentication for all users.</p>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={require2FA} onChange={(e) => setRequire2FA(e.target.checked)} />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute relative after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>
    </div>
  );
}
