const express = require('express');
const { getDb } = require('../db');
const { hashPassword, verifyPassword, signToken } = require('../auth');

function normalizeUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, name: u.name };
}

function buildAuthRouter() {
  const r = express.Router();
  const db = getDb();

  r.post('/signup', async (req, res, next) => {
    try {
      const { email, password, name } = req.body || {};
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return next({ status: 422, code: 'invalid_email', message: 'Valid email is required' });
      }
      if (!password || typeof password !== 'string' || password.length < 4) {
        return next({ status: 422, code: 'invalid_password', message: 'Password must be at least 4 characters' });
      }
      if (!name || typeof name !== 'string' || !name.trim()) {
        return next({ status: 422, code: 'invalid_name', message: 'Name is required' });
      }
      const now = new Date().toISOString();
      const pwHash = await hashPassword(password);
      try {
        const info = db.prepare('INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(email, pwHash, name.trim(), now, now);
        const user = { id: info.lastInsertRowid, email, name: name.trim() };
        return res.status(201).json(user);
      } catch (e) {
        if (String(e.message || '').includes('UNIQUE') || String(e.message || '').includes('unique')) {
          return next({ status: 422, code: 'duplicate_email', message: 'Email already in use' });
        }
        throw e;
      }
    } catch (err) {
      next(err);
    }
  });

  r.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return next({ status: 422, code: 'invalid_credentials', message: 'Email and password are required' });
      }
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user) {
        return next({ status: 422, code: 'invalid_credentials', message: 'Invalid email or password' });
      }
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) {
        return next({ status: 422, code: 'invalid_credentials', message: 'Invalid email or password' });
      }
      const token = signToken({ sub: user.id });
      return res.json({ token, user: normalizeUser(user) });
    } catch (err) {
      next(err);
    }
  });

  return r;
}

module.exports = { buildAuthRouter };
