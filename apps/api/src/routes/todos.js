const express = require('express');
const { z } = require('zod');

const router = express.Router();

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  completed: z.boolean().optional(),
});

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

let todos = [];
let nextId = 1;

function nowIso() {
  return new Date().toISOString();
}

function parseTodoId(idParam) {
  if (!/^\d+$/.test(idParam)) return null;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function resetTodos(seedTodos = []) {
  todos = seedTodos.map((todo, index) => {
    const id = todo.id ?? index + 1;
    const createdAt = todo.createdAt ?? nowIso();
    return {
      id,
      title: todo.title,
      completed: todo.completed ?? false,
      description: todo.description ?? null,
      createdAt,
      updatedAt: todo.updatedAt ?? createdAt,
    };
  });
  nextId = todos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;
}

function findTodo(id) {
  return todos.find((todo) => todo.id === id);
}

router.get('/todos', (req, res) => {
  res.json([...todos].sort((a, b) => a.id - b.id));
});

router.get('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const todo = findTodo(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  return res.json(todo);
});

router.post('/todos', (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const timestamp = nowIso();
  const todo = {
    id: nextId,
    title: parse.data.title,
    completed: parse.data.completed ?? false,
    description: parse.data.description ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  nextId += 1;
  todos.push(todo);

  return res.status(201).json(todo);
});

router.put('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const todo = findTodo(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  if (parse.data.title !== undefined) todo.title = parse.data.title;
  if (parse.data.description !== undefined) todo.description = parse.data.description;
  if (parse.data.completed !== undefined) todo.completed = parse.data.completed;
  todo.updatedAt = nowIso();

  return res.json(todo);
});

router.delete('/todos/:id', (req, res) => {
  const id = parseTodoId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  todos.splice(index, 1);
  return res.status(204).send();
});

module.exports = router;
module.exports.resetTodos = resetTodos;
