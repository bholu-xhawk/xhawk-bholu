const express = require('express');
const { z } = require('zod');

const router = express.Router();

const todos = new Map();
let nextId = 1;

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
});

const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
});

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function orderedTodos() {
  return Array.from(todos.values()).sort((a, b) => a.id - b.id);
}

router.get('/todos', (req, res) => {
  res.json(orderedTodos());
});

router.get('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const todo = todos.get(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  res.json(todo);
});

router.post('/todos', (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const now = new Date().toISOString();
  const todo = {
    id: nextId,
    title: parse.data.title,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  nextId += 1;
  todos.set(todo.id, todo);

  res.status(201).json(todo);
});

router.put('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const todo = todos.get(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  const updated = {
    ...todo,
    ...parse.data,
    updatedAt: new Date().toISOString(),
  };
  todos.set(id, updated);

  res.json(updated);
});

router.delete('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  if (!todos.has(id)) return res.status(404).json({ error: 'Todo not found' });

  todos.delete(id);
  res.status(204).send();
});

module.exports = router;
