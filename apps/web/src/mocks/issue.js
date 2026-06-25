// GitHub-style Issue mock utilities (ESM)

function defaultUser() {
  return {
    login: 'octocat',
    id: 1,
    html_url: 'https://github.com/octocat',
  };
}

export function makeIssue(overrides = {}) {
  const now = new Date().toISOString();
  const number = overrides.number ?? 1;
  const id = overrides.id ?? number;

  const computed = {
    id,
    number,
    title: 'Sample issue title',
    body: 'This is a mock GitHub issue used for testing and examples.',
    state: 'open', // 'open' | 'closed'
    labels: [], // e.g., [{ name: 'bug', color: 'd73a4a' }]
    assignees: [], // e.g., [{ login: 'octocat' }]
    comments: 0,
    created_at: now,
    updated_at: now,
    closed_at: null,
    user: defaultUser(),
    html_url: `https://github.com/org/repo/issues/${number}`,
    // Attachments: array of { filename, contentType, size, url }
    attachments: [],
  };

  // Apply overrides last to allow explicit overriding of any field
  return { ...computed, ...overrides };
}

export function makeIssueList(count = 3, overridesFn) {
  const issues = [];
  for (let i = 0; i < count; i++) {
    const base = { id: i + 1, number: i + 1 };
    const overrides = typeof overridesFn === 'function' ? overridesFn(i) : undefined;
    issues.push(makeIssue({ ...base, ...(overrides || {}) }));
  }
  return issues;
}

// Helper to create an issue with validated attachments
// Accepts only images (image/*) and PDFs (application/pdf)
export function makeIssueWithAttachments(attachments, overrides = {}) {
  if (!Array.isArray(attachments)) {
    throw new Error('attachments must be an array');
  }

  const validated = attachments.map((att, idx) => {
    const { filename, contentType, size } = att || {};
    if (!contentType || typeof contentType !== 'string') {
      throw new Error('Unsupported attachment type');
    }
    const allowed = contentType.startsWith('image/') || contentType === 'application/pdf';
    if (!allowed) {
      throw new Error('Unsupported attachment type');
    }
    const safeName = filename ? encodeURIComponent(filename) : `attachment-${idx + 1}`;
    const url = att.url || `https://files.example/${safeName}`;
    return { filename, contentType, size, url };
  });

  return makeIssue({ ...overrides, attachments: validated });
}

