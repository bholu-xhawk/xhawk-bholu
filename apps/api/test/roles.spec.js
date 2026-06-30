const { describe, it, expect, vi } = require('vitest');
const { requireRole } = require('../src/middleware/authorize');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
  };
}

describe('requireRole middleware', () => {
  it('allows when role is permitted', () => {
    const req = { user: { id: 1, email: 'a@b.com', role: 'ADMIN' } };
    const res = mockRes();
    const next = vi.fn();

    const mw = requireRole('ADMIN');
    mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('blocks when role is missing', () => {
    const req = { user: { id: 1, email: 'a@b.com' } };
    const res = mockRes();
    const next = vi.fn();

    const mw = requireRole('ADMIN');
    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  it('blocks when role not permitted', () => {
    const req = { user: { id: 1, email: 'a@b.com', role: 'USER' } };
    const res = mockRes();
    const next = vi.fn();

    const mw = requireRole('ADMIN');
    mw(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  it('accepts multiple roles', () => {
    const req = { user: { id: 1, email: 'a@b.com', role: 'GUEST' } };
    const res = mockRes();
    const next = vi.fn();

    const mw = requireRole('ADMIN', 'GUEST');
    mw(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
