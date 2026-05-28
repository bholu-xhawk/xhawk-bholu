const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Ensure directory and file exist
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(USERS_FILE, '[]', 'utf8');
      return [];
    }
    throw err;
  }
}

function writeUsers(users) {
  // Write atomically via temp file then rename
  const tempFile = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(tempFile, USERS_FILE);
}

function listUsers() {
  return readUsers();
}

function getUserById(id) {
  const users = readUsers();
  return users.find(u => u.id === id) || null;
}

function createUser(data) {
  const users = readUsers();
  const now = new Date().toISOString();
  const user = {
    id: uuidv4(),
    name: data.name,
    email: data.email,
    createdAt: now,
    updatedAt: now,
    ...data.extra // allow extra fields via 'extra' bag if provided
  };
  users.push(user);
  writeUsers(users);
  return user;
}

function updateUser(id, updates) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  users[idx] = { ...users[idx], ...updates, id, updatedAt: now };
  writeUsers(users);
  return users[idx];
}

function deleteUser(id) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  writeUsers(users);
  return true;
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
