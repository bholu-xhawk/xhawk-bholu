const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

let db;

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

function nowIso() {
  return new Date().toISOString();
}

function createUser({ email, password_hash, name = null }) {
  initDb();
  const ts = nowIso();
  const stmt = db.prepare(
    'INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(email, password_hash, name, ts, ts);
  return getUserById(info.lastInsertRowid);
}

function getUserById(id) {
  initDb();
  const stmt = db.prepare('SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE id = ?');
  return stmt.get(id) || null;
}

function getUserByEmail(email) {
  initDb();
  const stmt = db.prepare('SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = ?');
  return stmt.get(email) || null;
}

function listUsers() {
  initDb();
  const stmt = db.prepare('SELECT id, email, name, created_at, updated_at FROM users ORDER BY id ASC');
  return stmt.all();
}

function updateUser(id, { email, name }) {
  initDb();
  const current = getUserById(id);
  if (!current) return null;
  const newEmail = email !== undefined ? email : current.email;
  const newName = name !== undefined ? name : current.name;
  const ts = nowIso();
  const stmt = db.prepare('UPDATE users SET email = ?, name = ?, updated_at = ? WHERE id = ?');
  const info = stmt.run(newEmail, newName, ts, id);
  if (info.changes === 0) return null;
  return getUserById(id);
}

function deleteUser(id) {
  initDb();
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const info = stmt.run(id);
  return info.changes > 0;
}

module.exports = {
  initDb,
  createUser,
  getUserById,
  getUserByEmail,
  listUsers,
  updateUser,
  deleteUser,
};
