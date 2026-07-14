const express = require('express');
const { z } = require('zod');
const { createTodo, deleteTodo, listTodos, updateTodo } = require('../todoStore');

const router = express.Router();

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
}).strict();

const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
}).strict().refine((data) => data.title !== undefined || data.completed !== undefined, {
  message: 'At least one field is required',
});

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

router.get('/todos', (req, res) => {
  res.json(listTodos());
});

router.post('/todos', (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const todo = createTodo(parse.data.title);
  return res.status(201).json(todo);
});

router.put('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const todo = updateTodo(id, parse.data);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  return res.json(todo);
});

router.delete('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const deleted = deleteTodo(id);
  if (!deleted) return res.status(404).json({ error: 'Todo not found' });
  return res.status(204).send();
});

module.exports = router;
