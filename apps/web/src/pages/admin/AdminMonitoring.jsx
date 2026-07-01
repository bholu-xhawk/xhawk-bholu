import React, { useEffect, useRef, useState } from 'react';
import { HealthAPI } from '../../api/client';

export default function AdminMonitoring() {
  const [status, setStatus] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  async function refresh() {
    setError(null);
    const start = performance.now();
    try {
      const res = await HealthAPI.get();
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
      setStatus(res?.status || 'unknown');
      setLastChecked(new Date());
    } catch (e) {
      setError(e.payload?.error || e.message || 'Failed to fetch health');
      setStatus('error');
      setLatencyMs(null);
      setLastChecked(new Date());
    }
  }

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 15000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const ok = status === 'ok';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Monitoring</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto-refresh every 15s
          </label>
          <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={refresh}>Refresh</button>
        </div>
      </div>

      <div className="rounded border bg-white p-4 shadow">
        <div className="mb-2">
          <span className={`rounded px-2 py-1 text-sm ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Status: {status || 'unknown'}</span>
        </div>
        <div className="text-sm text-gray-700">
          <div>Last checked: {lastChecked ? lastChecked.toLocaleString() : '-'}</div>
          <div>Latency: {latencyMs != null ? `${latencyMs} ms` : '-'}</div>
          {error && <div className="mt-2 text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
