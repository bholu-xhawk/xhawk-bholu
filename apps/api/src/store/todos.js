const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'todos.json');

let CACHE = null;

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function load() {
  if (CACHE !== null) return CACHE;
  ensureDir();
  try {
    if (!fs.existsSync(DATA_FILE)) {
      CACHE = [];
      return CACHE;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw) {
      CACHE = [];
      return CACHE;
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      CACHE = [];
      return CACHE;
    }
    CACHE = data;
    return CACHE;
  } catch (e) {
    CACHE = [];
    return CACHE;
  }
}

function save(todos) {
  CACHE = todos;
  ensureDir();
  const json = JSON.stringify(CACHE, null, 2);
  const tmp = DATA_FILE + '.tmp';
  try {
    fs.writeFileSync(tmp, json, 'utf8');
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    // ignore
  }
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
