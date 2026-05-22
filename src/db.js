const path = require('path');
const Database = require('better-sqlite3');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite3');
    dbInstance = new Database(dbPath);
    // Enforce foreign keys just in case for future tables
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

function migrate() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function toUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tokenVersion: row.token_version,
  };
}

module.exports = {
  getDb,
  migrate,
  toUserRow,
};
