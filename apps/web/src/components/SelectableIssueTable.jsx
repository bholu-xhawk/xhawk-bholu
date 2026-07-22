import React, { useMemo, useState } from 'react';
import { makeIssueList } from '../mocks/issue.js';

const INITIAL_ISSUE_COUNT = 5;

function makeInitialIssues() {
  return makeIssueList(INITIAL_ISSUE_COUNT, (index) => ({
    title: `Issue ${index + 1}: ${[
      'Improve onboarding checklist',
      'Fix retry copy on failed submit',
      'Add empty state for archived projects',
      'Investigate flaky notification delivery',
      'Document release handoff steps',
    ][index]}`,
    state: index % 2 === 0 ? 'open' : 'closed',
    comments: index * 2,
    user: {
      login: ['octocat', 'hubot', 'monalisa', 'defunkt', 'primer'][index],
      id: index + 1,
      html_url: `https://github.com/${['octocat', 'hubot', 'monalisa', 'defunkt', 'primer'][index]}`,
    },
  }));
}

export default function SelectableIssueTable() {
  const [items, setItems] = useState(makeInitialIssues);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allRowsSelected = items.length > 0 && items.every((item) => selectedIdSet.has(item.id));

  function selectSingleItem(id) {
    setSelectedIds([id]);
  }

  function toggleRowSelection(id) {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id]
    );
  }

  function toggleAllRows() {
    setSelectedIds(allRowsSelected ? [] : items.map((item) => item.id));
  }

  function deleteSelectedItems() {
    setItems((currentItems) => currentItems.filter((item) => !selectedIdSet.has(item.id)));
    setSelectedIds([]);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm" aria-labelledby="issue-table-title">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="issue-table-title" className="text-xl font-semibold text-gray-900">
            Issues
          </h2>
          <p className="mt-1 text-sm text-gray-600" aria-live="polite">
            {selectedIds.length} selected
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          disabled={selectedIds.length === 0}
          onClick={deleteSelectedItems}
        >
          Delete selected
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                <label className="flex items-center gap-2 font-medium normal-case tracking-normal text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={allRowsSelected}
                    onChange={toggleAllRows}
                    disabled={items.length === 0}
                  />
                  <span>Select all</span>
                </label>
              </th>
              <th scope="col" className="px-4 py-3">Issue</th>
              <th scope="col" className="px-4 py-3">Title</th>
              <th scope="col" className="px-4 py-3">State</th>
              <th scope="col" className="px-4 py-3">Author</th>
              <th scope="col" className="px-4 py-3">Comments</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan="7">
                  No issues remain.
                </td>
              </tr>
            ) : (
              items.map((issue) => {
                const isSelected = selectedIdSet.has(issue.id);

                return (
                  <tr key={issue.id} className={isSelected ? 'bg-blue-50' : undefined}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select issue #${issue.number}`}
                        checked={isSelected}
                        onChange={() => toggleRowSelection(issue.id)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      #{issue.number}
                    </td>
                    <td className="min-w-64 px-4 py-3 text-gray-700">{issue.title}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${issue.state === 'open' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {issue.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{issue.user.login}</td>
                    <td className="px-4 py-3 text-gray-700">{issue.comments}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        onClick={() => selectSingleItem(issue.id)}
                      >
                        Select Item
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
