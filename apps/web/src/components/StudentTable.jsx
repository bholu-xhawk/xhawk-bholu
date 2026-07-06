import React from "react";

export default function StudentTable({ data, pageSize = 10 }) {
  const [page, setPage] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));

  // Clamp page when data or pageSize changes
  React.useEffect(() => {
    if (page < 0) setPage(0);
    else if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  React.useEffect(() => {
    // when data or pageSize changes, ensure page is valid
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [data, pageSize]);

  const start = page * pageSize;
  const end = start + pageSize;
  const visible = (data || []).slice(start, end);

  const isFirst = page === 0;
  const isLast = page >= totalPages - 1 || (data || []).length === 0;

  return (
    <div>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">ID</th>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Age</th>
            <th className="border p-2 text-left">Grade</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((s) => (
            <tr key={s.id}>
              <td className="border p-2">{s.id}</td>
              <td className="border p-2">{s.name}</td>
              <td className="border p-2">{s.age}</td>
              <td className="border p-2">{s.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-center gap-2">
        <button
          aria-label="first-page"
          disabled={isFirst || (data || []).length === 0}
          onClick={() => setPage(0)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          First
        </button>
        <button
          aria-label="prev-page"
          disabled={isFirst || (data || []).length === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="mx-2">Page {page + 1} of {totalPages}</span>
        <button
          aria-label="next-page"
          disabled={isLast}
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
        <button
          aria-label="last-page"
          disabled={isLast}
          onClick={() => setPage(totalPages - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}
