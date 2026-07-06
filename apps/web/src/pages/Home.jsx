import React from 'react';
import StudentTable from '../components/StudentTable';
import { makeStudentList } from '../mocks/students';

export default function Home() {
  const data = React.useMemo(() => makeStudentList(50), []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Home</h1>
      <StudentTable data={data} pageSize={10} />
    </div>
  );
}

