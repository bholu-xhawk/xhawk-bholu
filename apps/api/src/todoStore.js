const seedTodos = [
  {
    id: 1,
    title: 'Plan the day',
    description: 'Review priorities and choose the first task.',
    completed: false,
  },
  {
    id: 2,
    title: 'Review pull requests',
    description: 'Check open changes and leave actionable feedback.',
    completed: true,
  },
  {
    id: 3,
    title: 'Update project notes',
    description: 'Capture decisions from the latest planning session.',
    completed: false,
  },
];

let todos = [];
let nextId = 1;

function cloneTodo(todo) {
  return { ...todo };
}

function resetTodos() {
  todos = seedTodos.map(cloneTodo);
  nextId = Math.max(...todos.map((todo) => todo.id)) + 1;
}

function listTodos() {
  return todos.map(cloneTodo);
}

function getTodo(id) {
  const todo = todos.find((item) => item.id === id);
  return todo ? cloneTodo(todo) : null;
}

function createTodo(data) {
  const todo = {
    id: nextId,
    title: data.title,
    description: data.description,
    completed: data.completed,
  };

  nextId += 1;
  todos.push(todo);

  return cloneTodo(todo);
}

function updateTodo(id, changes) {
  const todo = todos.find((item) => item.id === id);
  if (!todo) return null;

  if (changes.title !== undefined) todo.title = changes.title;
  if (changes.description !== undefined) todo.description = changes.description;
  if (changes.completed !== undefined) todo.completed = changes.completed;

  return cloneTodo(todo);
}

function deleteTodo(id) {
  const originalLength = todos.length;
  todos = todos.filter((todo) => todo.id !== id);
  return todos.length !== originalLength;
}

resetTodos();

module.exports = {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  resetTodos,
};
