import React from 'react';
import { useState, useMemo } from 'react';
import { makeStudentList } from '../mocks/student.js';

const STUDENT_COUNT = 50;
const students = makeStudentList(STUDENT_COUNT);
const PAGE_SIZES = [5, 10, 20];

export default function Students() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(students.length / pageSize);

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return students.slice(start, end);
  }, [page, pageSize]);

  const onPrev = () => setPage((p) => Math.max(1, p - 1));
  const onNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, students.length);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Students</h1>

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <span>Page size:</span>
          <select
            data-testid="page-size"
            className="border rounded p-1"
            value={pageSize}
            onChange={(e) => {
              const nextSize = Number(e.target.value);
              setPageSize(nextSize);
              setPage(1);
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <button
          data-testid="prev-btn"
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={onPrev}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          data-testid="next-btn"
          className="px-3 py-1 border rounded disabled:opacity-50"
          onClick={onNext}
          disabled={page >= totalPages}
        >
          Next
        </button>

        <div data-testid="page-indicator">Page {page} of {totalPages}</div>
        <div data-testid="range-indicator">Showing {startIdx}
          –{endIdx} of {students.length}</div>
      </div>

      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">Name</th>
            <th className="text-left p-2 border">Age</th>
            <th className="text-left p-2 border">Grade</th>
            <th className="text-left p-2 border">Enrolled</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((s) => (
            <tr key={s.id} data-testid="student-row" className="border-b">
              <td className="p-2 border">{s.name}</td>
              <td className="p-2 border">{s.age}</td>
              <td className="p-2 border">{s.grade}</td>
              <td className="p-2 border">{new Date(s.enrolled_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
