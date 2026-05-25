const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../auth');

function normalizeUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name };
}

function buildUsersRouter() {
  const r = express.Router();
  const db = getDb();

  r.use(authMiddleware);

  // List users - self-only (returns your own user in an array)
  r.get('/', (req, res, next) => {
    try {
      const u = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(req.user.id);
      return res.json(u ? [u] : []);
    } catch (err) {
      next(err);
    }
  });

  // Get user by id - must be self
  r.get('/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return next({ status: 422, code: 'invalid_id', message: 'Invalid user id' });
      }
      if (id !== req.user.id) {
        return next({ status: 422, code: 'forbidden', message: 'Cannot access other users' });
      }
      const u = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id);
      if (!u) return res.status(404).json({ error: 'not_found', message: 'User not found' });
      return res.json(u);
    } catch (err) {
      next(err);
    }
  });

  // Update user by id - must be self
  r.put('/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return next({ status: 422, code: 'invalid_id', message: 'Invalid user id' });
      }
      if (id !== req.user.id) {
        return next({ status: 422, code: 'forbidden', message: 'Cannot update other users' });
      }
      let { name, email } = req.body || {};
      const now = new Date().toISOString();

      const u = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!u) return res.status(404).json({ error: 'not_found', message: 'User not found' });

      name = (typeof name === 'string' && name.trim()) ? name.trim() : u.name;
      email = (typeof email === 'string' && email.includes('@')) ? email : u.email;

      try {
        db.prepare('UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?').run(name, email, now, id);
      } catch (e) {
        if (String(e.message || '').includes('UNIQUE') || String(e.message || '').includes('unique')) {
          return next({ status: 422, code: 'duplicate_email', message: 'Email already in use' });
        }
        throw e;
      }
      const nu = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(id);
      return res.json(nu);
    } catch (err) {
      next(err);
    }
  });

  // Delete user by id - must be self
  r.delete('/:id', (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return next({ status: 422, code: 'invalid_id', message: 'Invalid user id' });
      }
      if (id !== req.user.id) {
        return next({ status: 422, code: 'forbidden', message: 'Cannot delete other users' });
      }
      const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
      if (info.changes === 0) {
        return res.status(404).json({ error: 'not_found', message: 'User not found' });
      }
      return res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return r;
}

module.exports = { buildUsersRouter };
