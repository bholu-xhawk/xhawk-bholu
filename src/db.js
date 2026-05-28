const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'app.db');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

let db;
function getDb() {
  if (!db) {
    ensureDataDir();
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    ensureSchema();
  }
  return db;
}

function ensureSchema() {
  const dbi = db || new Database(dbPath);
  dbi.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  if (!db) {
    db = dbi;
  }
}

module.exports = { getDb, ensureSchema };