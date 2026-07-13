const express = require('express');
const { z } = require('zod');
const store = require('../storage/todos.store');

const router = express.Router();

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
});

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    completed: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided',
  });

function parseId(param) {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

router.get('/todos', (req, res) => {
  const todos = store.getAll();
  res.json(todos);
});

router.post('/todos', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const todo = store.create(parsed.data);
  res.status(201).json(todo);
});

router.get('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const todo = store.getById(id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

router.put('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const updated = store.update(id, parsed.data);
  if (!updated) return res.status(404).json({ error: 'Todo not found' });
  res.json(updated);
});

router.delete('/todos/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const ok = store.remove(id);
  if (!ok) return res.status(404).json({ error: 'Todo not found' });
  res.status(204).send();
});

module.exports = router;

