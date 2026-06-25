const fs = require('fs');
const path = require('path');

describe('agent-brief.md', () => {
  test('exists and has expected structure', () => {
    const p = path.resolve(__dirname, '../../../../docs/agent-brief.md');
    const content = fs.readFileSync(p, 'utf8');
    const normalized = content.replace(/\r\n/g, '\n');

    expect(normalized).toMatch(/#\s+Dashboard State Management Architecture/);
    expect(normalized.length).toBeGreaterThan(1000);

    const head = normalized.slice(0, 200);
    expect(head).toMatchInlineSnapshot(`
"# Dashboard State Management Architecture\n\nDate: 2026-03-26\nBranch: feature/dashboard-state-architecture\nStatus: RFC Accepted\n\nThis brief proposes a layered, predictable state model for the Dashboard "
`);
  });
});
