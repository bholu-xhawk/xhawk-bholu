const { db } = require('../db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function toPublic(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name || null,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

function hashPassword(password) {
  const salt = bcrypt.genSaltSync(SALT_ROUNDS);
  return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function createUser({ email, password, name }) {
  const password_hash = hashPassword(password);
  try {
    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    );
    const info = stmt.run(email.toLowerCase(), password_hash, name || null);
    const row = db
      .prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?')
      .get(info.lastInsertRowid);
    return toPublic(row);
  } catch (err) {
    if (err && err.code && String(err.code).includes('SQLITE_CONSTRAINT')) {
      const e = new Error('Email already in use');
      e.status = 422;
      e.code = 'DUPLICATE_EMAIL';
      throw e;
    }
    throw err;
  }
}

function getUserByEmail(email) {
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get((email || '').toLowerCase());
  return row || null;
}

function getUserById(id) {
  const row = db
    .prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?')
    .get(id);
  return toPublic(row);
}

function listUsers({ limit = 50, offset = 0 } = {}) {
  const rows = db
    .prepare(
      'SELECT id, email, name, created_at, updated_at FROM users ORDER BY id LIMIT ? OFFSET ?'
    )
    .all(limit, offset);
  return rows.map(toPublic);
}

function updateUser(id, patch) {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!current) return null;
  const next = { ...current };
  if (patch.email !== undefined) next.email = String(patch.email).toLowerCase();
  if (patch.name !== undefined) next.name = patch.name;
  if (patch.password !== undefined && patch.password !== null) {
    next.password_hash = hashPassword(String(patch.password));
  }
  try {
    const stmt = db.prepare(
      'UPDATE users SET email = ?, name = ?, password_hash = ? WHERE id = ?'
    );
    stmt.run(next.email, next.name || null, next.password_hash, id);
  } catch (err) {
    if (err && err.code && String(err.code).includes('SQLITE_CONSTRAINT')) {
      const e = new Error('Email already in use');
      e.status = 422;
      e.code = 'DUPLICATE_EMAIL';
      throw e;
    }
    throw err;
  }
  return getUserById(id);
}

function deleteUser(id) {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
  hashPassword,
  verifyPassword,
};
