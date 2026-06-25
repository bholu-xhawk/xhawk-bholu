import { makeIssue, makeIssueWithAttachments } from '../mocks/issue.js';

describe('Issue attachments in mocks', () => {
  it('creates an issue with a PNG image attachment', () => {
    const issue = makeIssueWithAttachments([
      { filename: 'screenshot.png', contentType: 'image/png', size: 12345 },
    ]);

    expect(issue.attachments).toHaveLength(1);
    expect(issue.attachments[0]).toEqual(
      expect.objectContaining({
        filename: 'screenshot.png',
        contentType: 'image/png',
        size: 12345,
        url: expect.stringContaining('https://files.example/screenshot.png'),
      })
    );

    // core fields should still exist
    expect(issue.state).toBe('open');
    expect(issue.html_url).toEqual(expect.stringContaining('/issues/'));
  });

  it('creates an issue with a PDF attachment', () => {
    const issue = makeIssueWithAttachments([
      { filename: 'invoice.pdf', contentType: 'application/pdf', size: 54321 },
    ]);

    expect(issue.attachments).toHaveLength(1);
    expect(issue.attachments[0]).toEqual(
      expect.objectContaining({
        filename: 'invoice.pdf',
        contentType: 'application/pdf',
        size: 54321,
        url: 'https://files.example/invoice.pdf',
      })
    );
  });

  it('rejects disallowed attachment types', () => {
    expect(() =>
      makeIssueWithAttachments([
        { filename: 'notes.txt', contentType: 'text/plain', size: 100 },
      ])
    ).toThrow('Unsupported attachment type');
  });

  it('supports multiple attachments (image + pdf)', () => {
    const issue = makeIssueWithAttachments([
      { filename: 'screen.jpg', contentType: 'image/jpeg', size: 222 },
      { filename: 'spec.pdf', contentType: 'application/pdf', size: 333 },
    ]);

    expect(issue.attachments).toHaveLength(2);
    expect(issue.attachments[0]).toEqual(
      expect.objectContaining({ filename: 'screen.jpg', contentType: 'image/jpeg', size: 222 })
    );
    expect(issue.attachments[1]).toEqual(
      expect.objectContaining({ filename: 'spec.pdf', contentType: 'application/pdf', size: 333 })
    );
  });

  it('default makeIssue carries empty attachments array', () => {
    const issue = makeIssue();
    expect(Array.isArray(issue.attachments)).toBe(true);
    expect(issue.attachments).toHaveLength(0);
  });
});
