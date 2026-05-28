const Database = require('better-sqlite3');

let dbInstance;

function openDb() {
  if (!dbInstance) {
    const db = new Database(process.env.DB_FILE || 'app.db');
    db.pragma('journal_mode = WAL');
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    dbInstance = db;
  }
  return dbInstance;
}

function rowToUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

function getUserById(id) {
  const db = openDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return rowToUser(row);
}

function getUserByEmail(email) {
  const db = openDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return rowToUser(row);
}

function getUserWithPasswordByEmail(email) {
  const db = openDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function listUsers({ limit = 100, offset = 0 } = {}) {
  const db = openDb();
  const rows = db.prepare('SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?').all(limit, offset);
  return rows.map(rowToUser);
}

function createUser({ email, password_hash, name, role = 'user' }) {
  const db = openDb();
  const stmt = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)');
  const info = stmt.run(email, password_hash, name || null, role || 'user');
  return getUserById(info.lastInsertRowid);
}

function updateUser(id, { email, password_hash, name, role }) {
  const db = openDb();
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return null;
  const newEmail = email !== undefined ? email : existing.email;
  const newHash = password_hash !== undefined ? password_hash : existing.password_hash;
  const newName = name !== undefined ? name : existing.name;
  const newRole = role !== undefined ? role : existing.role;
  db.prepare('UPDATE users SET email=?, password_hash=?, name=?, role=? WHERE id=?').run(newEmail, newHash, newName, newRole, id);
  return getUserById(id);
}

function deleteUser(id) {
  const db = openDb();
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = {
  openDb,
  getUserById,
  getUserByEmail,
  getUserWithPasswordByEmail,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
