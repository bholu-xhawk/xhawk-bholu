import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SelectableIssueTable from './SelectableIssueTable.jsx';

function rowCheckbox(issueNumber) {
  return screen.getByRole('checkbox', { name: `Select issue #${issueNumber}` });
}

describe('SelectableIssueTable', () => {
  it('renders the issue table with initial rows and disabled delete action', () => {
    render(<SelectableIssueTable />);

    expect(screen.getByRole('heading', { name: /Issues/i })).toBeInTheDocument();
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete selected/i })).toBeDisabled();
    expect(screen.getByText('Issue 1: Improve onboarding checklist')).toBeInTheDocument();
    expect(screen.getByText('Issue 5: Document release handoff steps')).toBeInTheDocument();
  });

  it('replaces the current selection when a row Select Item action is clicked', () => {
    render(<SelectableIssueTable />);

    fireEvent.click(rowCheckbox(1));
    fireEvent.click(screen.getAllByRole('button', { name: /Select Item/i })[1]);

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(rowCheckbox(1)).not.toBeChecked();
    expect(rowCheckbox(2)).toBeChecked();
  });

  it('toggles multiple rows through row checkboxes', () => {
    render(<SelectableIssueTable />);

    fireEvent.click(rowCheckbox(1));
    fireEvent.click(rowCheckbox(3));

    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(rowCheckbox(1)).toBeChecked();
    expect(rowCheckbox(2)).not.toBeChecked();
    expect(rowCheckbox(3)).toBeChecked();
    expect(screen.getByRole('button', { name: /Delete selected/i })).toBeEnabled();
  });

  it('selects and clears all visible rows with the select-all checkbox', () => {
    render(<SelectableIssueTable />);

    const selectAll = screen.getByRole('checkbox', { name: /Select all/i });

    fireEvent.click(selectAll);

    expect(screen.getByText('5 selected')).toBeInTheDocument();
    expect(selectAll).toBeChecked();
    for (let issueNumber = 1; issueNumber <= 5; issueNumber += 1) {
      expect(rowCheckbox(issueNumber)).toBeChecked();
    }

    fireEvent.click(selectAll);

    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(selectAll).not.toBeChecked();
    for (let issueNumber = 1; issueNumber <= 5; issueNumber += 1) {
      expect(rowCheckbox(issueNumber)).not.toBeChecked();
    }
  });

  it('deletes selected rows and resets selection controls', () => {
    render(<SelectableIssueTable />);

    fireEvent.click(rowCheckbox(1));
    fireEvent.click(rowCheckbox(2));
    fireEvent.click(screen.getByRole('button', { name: /Delete selected/i }));

    expect(screen.queryByText('Issue 1: Improve onboarding checklist')).not.toBeInTheDocument();
    expect(screen.queryByText('Issue 2: Fix retry copy on failed submit')).not.toBeInTheDocument();
    expect(screen.getByText('Issue 3: Add empty state for archived projects')).toBeInTheDocument();
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Select all/i })).not.toBeChecked();
    expect(screen.getByRole('button', { name: /Delete selected/i })).toBeDisabled();
  });

  it('shows an empty state after deleting all rows', () => {
    render(<SelectableIssueTable />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Select all/i }));
    fireEvent.click(screen.getByRole('button', { name: /Delete selected/i }));

    expect(screen.getByText('No issues remain.')).toBeInTheDocument();
    expect(screen.getByText('0 selected')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Select all/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Delete selected/i })).toBeDisabled();
  });
});
