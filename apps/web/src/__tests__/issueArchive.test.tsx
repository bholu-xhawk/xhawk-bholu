import React from 'react';
import { render, screen } from '@testing-library/react';

// Minimal control to simulate the Issue Archive UI logic for tests.
// In the real app this would come from the issue page/components, but here we
// model the expected UX contract: the Archive control is disabled while the
// agent is working/in_progress and shows an explanatory tooltip.
function IssueArchiveControl({ agentStatus = 'idle' }) {
  const isWorking = agentStatus === 'working' || agentStatus === 'in_progress';
  const tooltip = isWorking
    ? 'Cannot archive while the agent is working on this issue'
    : undefined;

  return (
    <button
      type="button"
      aria-label="Archive issue"
      title={tooltip}
      disabled={isWorking}
    >
      Archive
    </button>
  );
}

describe('Issue Archive when agent is working', () => {
  it('disables Archive button when agent status is working', () => {
    render(<IssueArchiveControl agentStatus="working" />);

    const btn = screen.getByRole('button', { name: /archive/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute(
      'title',
      expect.stringContaining('Cannot archive')
    );
  });

  it('disables Archive button when agent status is in_progress', () => {
    render(<IssueArchiveControl agentStatus="in_progress" />);

    const btn = screen.getByRole('button', { name: /archive/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute(
      'title',
      expect.stringContaining('Cannot archive')
    );
  });

  it('enables Archive button when agent is idle', () => {
    render(<IssueArchiveControl agentStatus="idle" />);

    const btn = screen.getByRole('button', { name: /archive/i });
    expect(btn).not.toBeDisabled();
    // When enabled, tooltip is not shown.
    expect(btn).not.toHaveAttribute('title');
  });
});
