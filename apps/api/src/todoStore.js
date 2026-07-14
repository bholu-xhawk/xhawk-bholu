// Todos are intentionally stored in memory for this small demo feature.
// They reset whenever the Node process restarts; no database persistence is used.
let todos = [];
let nextId = 1;

function cloneTodo(todo) {
  return { id: todo.id, title: todo.title, completed: todo.completed };
}

function normalizeTitle(title) {
  return title.trim().replace(/\s+/g, ' ');
}

function listTodos() {
  return todos.map(cloneTodo);
}

function createTodo(title) {
  const todo = {
    id: nextId,
    title: normalizeTitle(title),
    completed: false,
  };
  nextId += 1;
  todos.push(todo);
  return cloneTodo(todo);
}

function updateTodo(id, changes) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return null;

  if (changes.title !== undefined) {
    todo.title = normalizeTitle(changes.title);
  }
  if (changes.completed !== undefined) {
    todo.completed = changes.completed;
  }

  return cloneTodo(todo);
}

function deleteTodo(id) {
  const index = todos.findIndex((item) => item.id === id);
  if (index === -1) return false;
  todos.splice(index, 1);
  return true;
}

function resetTodosForTest(seedTodos = []) {
  todos = seedTodos.map((todo) => ({
    id: todo.id,
    title: normalizeTitle(todo.title),
    completed: Boolean(todo.completed),
  }));
  nextId = todos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;
}

module.exports = {
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  resetTodosForTest,
};
