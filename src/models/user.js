const { getDb } = require('../db');

function createUser({ email, name, passwordHash }) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)'
  );
  const info = stmt.run(email, name || null, passwordHash);
  return getUserById(info.lastInsertRowid);
}

function getUserByEmail(email) {
  const db = getDb();
  const stmt = db.prepare('SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?');
  return stmt.get(email);
}

function getUserById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?');
  return stmt.get(id);
}

function listUsers() {
  const db = getDb();
  const stmt = db.prepare('SELECT id, email, name, created_at FROM users ORDER BY id ASC');
  return stmt.all();
}

function updateUser(id, fields) {
  const db = getDb();
  const setClauses = [];
  const params = [];
  if (fields.email !== undefined) {
    setClauses.push('email = ?');
    params.push(fields.email);
  }
  if (fields.name !== undefined) {
    setClauses.push('name = ?');
    params.push(fields.name);
  }
  if (fields.passwordHash !== undefined) {
    setClauses.push('password_hash = ?');
    params.push(fields.passwordHash);
  }
  if (setClauses.length === 0) {
    return getUserById(id);
  }
  params.push(id);
  const stmt = db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`);
  stmt.run(...params);
  return getUserById(id);
}

function deleteUser(id) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
};