const express = require('express');
const { z } = require('zod');

const router = express.Router();

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().default(''),
  completed: z.boolean().optional().default(false),
}).strict();

const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

const todos = [];
let nextId = 1;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function findTodoIndex(id) {
  return todos.findIndex((todo) => todo.id === id);
}

router.post('/todos', (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const todo = {
    id: nextId,
    title: parse.data.title,
    description: parse.data.description,
    completed: parse.data.completed,
  };
  nextId += 1;
  todos.push(todo);

  res.status(201).json(todo);
});

router.get('/todos', (req, res) => {
  res.json(todos);
});

router.get('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const todo = todos.find((item) => item.id === id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  res.json(todo);
});

router.put('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const index = findTodoIndex(id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  const updated = {
    ...todos[index],
    ...parse.data,
  };
  todos[index] = updated;

  res.json(updated);
});

router.delete('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const index = findTodoIndex(id);
  if (index === -1) return res.status(404).json({ error: 'Todo not found' });

  todos.splice(index, 1);
  res.status(204).send();
});

module.exports = router;
