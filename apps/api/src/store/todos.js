const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'todos.json');

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function load() {
  ensureDir();
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    return [];
  }
}

function save(todos) {
  ensureDir();
  const json = JSON.stringify(todos, null, 2);
  fs.writeFileSync(DATA_FILE, json, 'utf8');
}

function nextId(todos) {
  if (!todos.length) return 1;
  return Math.max(...todos.map(t => Number(t.id) || 0)) + 1;
}

function getAll() {
  return load();
}

function add(text) {
  const todos = load();
  const todo = {
    id: nextId(todos),
    text,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  save(todos);
  return todo;
}

function update(id, patch) {
  const todos = load();
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return null;
  const cur = todos[idx];
  const updated = { ...cur };
  if (patch.text !== undefined) updated.text = patch.text;
  if (patch.completed !== undefined) updated.completed = patch.completed;
  todos[idx] = updated;
  save(todos);
  return updated;
}

function remove(id) {
  const todos = load();
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return false;
  todos.splice(idx, 1);
  save(todos);
  return true;
}

module.exports = {
  DATA_FILE,
  load,
  save,
  nextId,
  getAll,
  add,
  update,
  remove,
};
