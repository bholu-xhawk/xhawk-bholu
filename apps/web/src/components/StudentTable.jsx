import React, { useMemo, useState } from 'react';

export default function StudentTable() {
  const [students, setStudents] = useState([
    { id: 1, name: 'Alice', age: 14, grade: '9' },
    { id: 2, name: 'Bob', age: 15, grade: '10' },
    { id: 3, name: 'Charlie', age: 16, grade: '11' },
    { id: 4, name: 'Diana', age: 14, grade: '9' },
    { id: 5, name: 'Evan', age: 17, grade: '12' },
  ]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const allSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size === students.length;
  }, [selectedIds, students.length]);

  const toggleSelectAll = (e) => {
    const { checked } = e.target;
    if (checked) {
      setSelectedIds(new Set(students.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleRow = (id) => (e) => {
    const { checked } = e.target;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const deleteRow = (id) => () => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const deleteSelected = () => {
    setStudents((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Students</h2>
        <button
          onClick={deleteSelected}
          disabled={selectedIds.size === 0}
          className={`px-3 py-1 rounded text-white ${
            selectedIds.size === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Delete Selected
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">
                <input
                  type="checkbox"
                  aria-label="Select All"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Age</th>
              <th className="p-2 border">Grade</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border">
                  <input
                    type="checkbox"
                    aria-label={`Select ${s.name}`}
                    checked={selectedIds.has(s.id)}
                    onChange={toggleRow(s.id)}
                  />
                </td>
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{s.age}</td>
                <td className="p-2 border">{s.grade}</td>
                <td className="p-2 border">
                  <button
                    onClick={deleteRow(s.id)}
                    className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td className="p-3 text-center text-gray-600" colSpan={5}>
                  No students
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
