const express = require('express');
const { z } = require('zod');
const {
  listTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
} = require('../todoStore');

const router = express.Router();

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().default(''),
  completed: z.boolean().default(false),
});

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

function parseTodoId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return null;
  }
  return id;
}

router.get('/todos', (req, res) => {
  res.json(listTodos());
});

router.get('/todos/:id', (req, res) => {
  const id = parseTodoId(req, res);
  if (id === null) return;

  const todo = getTodo(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  return res.json(todo);
});

router.post('/todos', (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const todo = createTodo(parse.data);
  return res.status(201).json(todo);
});

router.put('/todos/:id', (req, res) => {
  const id = parseTodoId(req, res);
  if (id === null) return;

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const todo = updateTodo(id, parse.data);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  return res.json(todo);
});

router.delete('/todos/:id', (req, res) => {
  const id = parseTodoId(req, res);
  if (id === null) return;

  const deleted = deleteTodo(id);
  if (!deleted) return res.status(404).json({ error: 'Todo not found' });

  return res.status(204).send();
});

module.exports = router;
