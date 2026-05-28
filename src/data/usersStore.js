const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_FILE = path.join(__dirname, 'users.json');

async function loadUsers() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Initialize file
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, '[]', 'utf8');
      return [];
    }
    throw err;
  }
}

async function saveUsers(users) {
  const data = JSON.stringify(users, null, 2) + '\n';
  await fs.writeFile(DATA_FILE, data, 'utf8');
}

async function getUserById(id) {
  const users = await loadUsers();
  return users.find(u => u.id === id) || null;
}

async function createUser({ name, email }) {
  if (!name || !email) {
    const e = new Error('name and email are required');
    e.status = 400;
    throw e;
  }
  const users = await loadUsers();
  const user = { id: randomUUID(), name, email };
  users.push(user);
  await saveUsers(users);
  return user;
}

async function updateUser(id, { name, email }) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  const existing = users[idx];
  const updated = { ...existing };
  if (name !== undefined) updated.name = name;
  if (email !== undefined) updated.email = email;
  users[idx] = updated;
  await saveUsers(users);
  return updated;
}

async function deleteUser(id) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return false;
  users.splice(idx, 1);
  await saveUsers(users);
  return true;
}

module.exports = { loadUsers, saveUsers, getUserById, createUser, updateUser, deleteUser };
