const express = require('express');
const { z } = require('zod');

const router = express.Router();

let todos = [];
let nextTodoId = 1;

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional().default(false),
}).strict();

const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
}).strict().refine(
  (todo) => todo.title !== undefined || todo.completed !== undefined,
  { message: 'At least one of title or completed is required' },
);

function parseTodoId(idParam) {
  if (!/^\d+$/.test(idParam)) return null;
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

function serializeTodo(todo) {
  return {
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    createdAt: todo.createdAt.toISOString(),
    updatedAt: todo.updatedAt.toISOString(),
  };
}

function now() {
  return new Date();
}

function findTodo(id) {
  return todos.find((todo) => todo.id === id);
}

function resetTodosForTest() {
  todos = [];
  nextTodoId = 1;
}

router.get('/todos', (req, res) => {
  res.json(todos.map(serializeTodo));
});

router.post('/todos', (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const timestamp = now();
  const todo = {
    id: nextTodoId,
    title: parse.data.title,
    completed: parse.data.completed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  nextTodoId += 1;
  todos.push(todo);

  res.status(201).json(serializeTodo(todo));
});

router.get('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'Invalid id' });

  const todo = findTodo(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  res.json(serializeTodo(todo));
});

router.patch('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const todo = findTodo(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  if (parse.data.title !== undefined) todo.title = parse.data.title;
  if (parse.data.completed !== undefined) todo.completed = parse.data.completed;
  todo.updatedAt = now();

  res.json(serializeTodo(todo));
});

router.delete('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'Invalid id' });

  const todoIndex = todos.findIndex((todo) => todo.id === id);
  if (todoIndex === -1) return res.status(404).json({ error: 'Todo not found' });

  todos.splice(todoIndex, 1);
  res.status(204).send();
});

module.exports = router;
module.exports.resetTodosForTest = resetTodosForTest;
