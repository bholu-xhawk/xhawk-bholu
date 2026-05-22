const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let db;

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (dir !== ':' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getDb() {
  if (db) return db;
  const dbFile = process.env.DB_FILE || path.join('data', 'app.db');
  if (dbFile !== ':memory:') ensureDirFor(dbFile);
  db = new Database(dbFile);
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TRIGGER IF NOT EXISTS users_updated_at
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

function createUser({ email, passwordHash, name }) {
  const stmt = getDb().prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
  );
  const info = stmt.run(email, passwordHash, name);
  return getUserById(info.lastInsertRowid);
}

function getUserByEmail(email) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

function getUserById(id) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

function listUsers() {
  const stmt = getDb().prepare('SELECT * FROM users ORDER BY id');
  return stmt.all();
}

function updateUser(id, { name, email, passwordHash }) {
  const parts = [];
  const vals = [];
  if (name !== undefined) {
    parts.push('name = ?');
    vals.push(name);
  }
  if (email !== undefined) {
    parts.push('email = ?');
    vals.push(email);
  }
  if (passwordHash !== undefined) {
    parts.push('password_hash = ?');
    vals.push(passwordHash);
  }
  if (parts.length === 0) return getUserById(id);
  vals.push(id);
  const sql = `UPDATE users SET ${parts.join(', ')} WHERE id = ?`;
  const info = getDb().prepare(sql).run(...vals);
  if (info.changes === 0) return null;
  return getUserById(id);
}

function deleteUser(id) {
  const info = getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = {
  getDb,
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
};
