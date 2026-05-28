const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_FILE = path.join(__dirname, 'users.json');

async function loadUsers() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Ensure file exists
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, '[]', 'utf8');
      return [];
    }
    throw err;
  }
}

async function saveUsers(users) {
  const data = JSON.stringify(users, null, 2);
  await fs.writeFile(DATA_FILE, data + '\n', 'utf8');
}

async function getUserById(id) {
  const users = await loadUsers();
  return users.find(u => u.id === id) || null;
}

async function createUser({ name, email }) {
  const users = await loadUsers();
  const user = { id: randomUUID(), name, email };
  users.push(user);
  await saveUsers(users);
  return user;
}

async function updateUser(id, updates) {
  const users = await loadUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates, id };
  await saveUsers(users);
  return users[idx];
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
