const express = require('express');
const { z } = require('zod');
const store = require('../store/todos');

const router = express.Router();

const createSchema = z.object({
  text: z.string().min(1),
});

const updateSchema = z
  .object({
    text: z.string().min(1).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Must provide at least one field',
    path: ['text'],
  });

router.get('/todos', (req, res) => {
  const todos = store.getAll().sort((a, b) => a.id - b.id);
  res.json(todos);
});

router.post('/todos', (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const todo = store.add(parse.data.text);
  res.status(201).json(todo);
});

router.put('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const updated = store.update(id, parse.data);
  if (!updated) return res.status(404).json({ error: 'Todo not found' });
  res.json(updated);
});

router.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const ok = store.remove(id);
  if (!ok) return res.status(404).json({ error: 'Todo not found' });
  res.status(204).send();
});

module.exports = router;
