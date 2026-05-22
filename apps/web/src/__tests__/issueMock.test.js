import { makeIssue, makeIssueList } from '../mocks/issue.js';

describe('Issue mock utilities', () => {
  it('creates a default issue with expected shape and defaults', () => {
    const issue = makeIssue();
    expect(issue).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        number: expect.any(Number),
        title: expect.any(String),
        body: expect.any(String),
        state: 'open',
        labels: expect.any(Array),
        assignees: expect.any(Array),
        comments: 0,
        created_at: expect.any(String),
        updated_at: expect.any(String),
        closed_at: null,
        user: expect.objectContaining({ login: expect.any(String) }),
        html_url: expect.stringContaining('/issues/'),
      })
    );

    // timestamps should be ISO strings
    expect(new Date(issue.created_at).toString()).not.toBe('Invalid Date');
    expect(new Date(issue.updated_at).toString()).not.toBe('Invalid Date');
  });

  it('applies overrides correctly', () => {
    const custom = makeIssue({
      id: 42,
      number: 101,
      title: 'Overridden title',
      state: 'closed',
      labels: [{ name: 'bug', color: 'd73a4a' }],
      user: { login: 'alice', id: 999, html_url: 'https://github.com/alice' },
      closed_at: new Date('2020-01-01').toISOString(),
    });

    expect(custom.id).toBe(42);
    expect(custom.number).toBe(101);
    expect(custom.title).toBe('Overridden title');
    expect(custom.state).toBe('closed');
    expect(custom.labels).toEqual([{ name: 'bug', color: 'd73a4a' }]);
    expect(custom.user.login).toBe('alice');
    expect(custom.closed_at).toEqual(expect.any(String));
  });

  it('generates a list with unique id/number and correct length', () => {
    const list = makeIssueList(5);
    expect(list).toHaveLength(5);

    const ids = new Set(list.map((i) => i.id));
    const numbers = new Set(list.map((i) => i.number));
    expect(ids.size).toBe(5);
    expect(numbers.size).toBe(5);

    // sanity check defaults per item
    for (const issue of list) {
      expect(issue.state).toBe('open');
      expect(Array.isArray(issue.labels)).toBe(true);
    }
  });

  it('applies per-index overrides via overridesFn', () => {
    const list = makeIssueList(4, (idx) => ({ state: idx % 2 === 0 ? 'open' : 'closed' }));
    expect(list.map((i) => i.state)).toEqual(['open', 'closed', 'open', 'closed']);
  });

  it('resets mock state on restart (module reload)', () => {
    // First load and monkey-patch the module's export to simulate stateful change
    jest.isolateModules(() => {
      const mod1 = require('../mocks/issue.js');
      const originalMakeIssue = mod1.makeIssue;
      // Patch makeIssue to change the default title
      mod1.makeIssue = (overrides = {}) => originalMakeIssue({ ...overrides, title: 'Patched Title' });
      expect(mod1.makeIssue().title).toBe('Patched Title');
    });

    // Simulate process restart by clearing Jest's module registry
    jest.resetModules();

    // Re-require should restore the original defaults
    jest.isolateModules(() => {
      const mod2 = require('../mocks/issue.js');
      expect(mod2.makeIssue().title).toBe('Sample issue title');
    });
  });
});
