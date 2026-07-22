import React from 'react';
import SelectableIssueTable from '../components/SelectableIssueTable.jsx';

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Home</h1>
      <SelectableIssueTable />
    </div>
  );
}
