import React, { useMemo, useState, useEffect } from 'react';
import StudentTable from '../components/StudentTable.jsx';
import { makeStudentList } from '../mocks/students.js';

export default function Students() {
  const students = useMemo(() => makeStudentList(100), []);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Clamp page to bounds when pageSize or data length changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(students.length / Math.max(1, pageSize)));
    if (page > totalPages) {
      setPage(totalPages);
    }
    if (page < 1) {
      setPage(1);
    }
  }, [students.length, pageSize, page]);

  const handlePageChange = (p) => setPage(p);
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Students</h1>
      <StudentTable
        rows={students}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
