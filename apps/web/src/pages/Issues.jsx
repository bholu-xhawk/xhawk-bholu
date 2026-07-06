import React, { useEffect, useMemo, useState } from 'react';

export default function Issues() {
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState({ items: [], total: 0, offset: 0, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/issues?offset=${offset}&limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [offset, limit]);

  const hasNext = useMemo(() => offset + limit < (data?.total || 0), [offset, limit, data]);
  const hasPrev = useMemo(() => offset > 0, [offset]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Issues</h1>

      <div className="flex items-center gap-4">
        <button
          className={`px-3 py-1 rounded bg-gray-200 ${!hasPrev ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={!hasPrev}
        >
          Prev
        </button>
        <button
          className={`px-3 py-1 rounded bg-blue-600 text-white ${!hasNext ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => setOffset(offset + limit)}
          disabled={!hasNext}
        >
          Next
        </button>
        <label className="flex items-center gap-2">
          <span>Page size:</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
            className="border rounded p-1"
          >
            {[5,10,20,50,100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="text-sm text-gray-600">
          Showing {data.items.length} of {data.total} (offset {data.offset}, limit {data.limit})
        </div>
      </div>

      {error && <div className="text-red-600">Error: {String(error)}</div>}

      <div className="overflow-auto rounded border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">State</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-3">Loading…</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-3">No data</td></tr>
            ) : (
              data.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-2 whitespace-nowrap">{it.number}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{it.title}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{it.state}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(it.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
