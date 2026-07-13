const fs = require('fs');
const path = require('path');

const storePath = process.env.TODO_STORE_PATH || path.join(__dirname, 'todos.json');

function loadAll() {
  try {
    if (!fs.existsSync(storePath)) return [];
    const raw = fs.readFileSync(storePath, 'utf-8');
    if (!raw.trim()) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // On parse error, treat as empty to avoid crashing
    return [];
  }
}

function saveAll(todos) {
  fs.writeFileSync(storePath, JSON.stringify(todos, null, 2), 'utf-8');
}

function nextId(todos) {
  if (todos.length === 0) return 1;
  return Math.max(...todos.map((t) => t.id)) + 1;
}

function getAll() {
  return loadAll();
}

function getById(id) {
  const todos = loadAll();
  return todos.find((t) => t.id === id);
}

function create({ title, description = '' }) {
  const todos = loadAll();
  const now = new Date().toISOString();
  const todo = {
    id: nextId(todos),
    title,
    description,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  todos.push(todo);
  saveAll(todos);
  return todo;
}

function update(id, patch) {
  const todos = loadAll();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const existing = todos[idx];
  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...patch,
    updatedAt: now,
  };
  todos[idx] = updated;
  saveAll(todos);
  return updated;
}

function remove(id) {
  const todos = loadAll();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  todos.splice(idx, 1);
  saveAll(todos);
  return true;
}

module.exports = { getAll, getById, create, update, remove };
