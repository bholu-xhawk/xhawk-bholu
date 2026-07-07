import React from 'react';

export default function StudentTable({
  rows = [],
  page = 1,
  pageSize = 10,
  onPageChange = () => {},
  onPageSizeChange = () => {},
}) {
  const total = rows.length;
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const clampedPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIdx = (clampedPage - 1) * safePageSize;
  const endIdx = Math.min(startIdx + safePageSize, total);
  const visibleRows = rows.slice(startIdx, endIdx);

  const canPrev = clampedPage > 1;
  const canNext = clampedPage < totalPages;

  const handleFirst = () => canPrev && onPageChange(1);
  const handlePrev = () => canPrev && onPageChange(clampedPage - 1);
  const handleNext = () => canNext && onPageChange(clampedPage + 1);
  const handleLast = () => canNext && onPageChange(totalPages);
  const handlePageSize = (e) => {
    const nextSize = Number(e.target.value);
    onPageSizeChange(nextSize);
  };

  const showingFrom = total === 0 ? 0 : startIdx + 1;
  const showingTo = endIdx;

  return (
    <div className="bg-white shadow rounded">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <caption className="sr-only">Student list</caption>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
              <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleRows.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.id}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.firstName} {s.lastName}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.email}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.grade}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(s.enrolledAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm text-gray-700" aria-live="polite">
          {`Showing ${showingFrom}-${showingTo} of ${total} students`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-sm text-gray-700">Rows per page</label>
            <select id="page-size" value={safePageSize} onChange={handlePageSize} className="border rounded px-2 py-1">
              {[5, 10, 20].map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleFirst} disabled={!canPrev} className="px-2 py-1 border rounded disabled:opacity-50">First</button>
            <button onClick={handlePrev} disabled={!canPrev} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
            <span className="text-sm text-gray-700">Page {clampedPage} of {totalPages}</span>
            <button onClick={handleNext} disabled={!canNext} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
            <button onClick={handleLast} disabled={!canNext} className="px-2 py-1 border rounded disabled:opacity-50">Last</button>
          </div>
        </div>
      </div>
    </div>
  );
}
