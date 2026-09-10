const prisma = require('../prisma');

const todoSelect = {
  id: true,
  title: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
};

function listTodos(userId) {
  return prisma.todo.findMany({
    where: { userId },
    select: todoSelect,
    orderBy: { id: 'asc' },
  });
}

function createTodo(userId, title) {
  return prisma.todo.create({
    data: { title, userId },
    select: todoSelect,
  });
}

async function updateTodoCompleted(userId, id, completed) {
  try {
    return await prisma.todo.update({
      where: { id, userId },
      data: { completed },
      select: todoSelect,
    });
  } catch (err) {
    if (err.code === 'P2025') return null;
    throw err;
  }
}

async function deleteTodo(userId, id) {
  const result = await prisma.todo.deleteMany({
    where: { id, userId },
  });

  return result.count > 0;
}

module.exports = {
  listTodos,
  createTodo,
  updateTodoCompleted,
  deleteTodo,
};
