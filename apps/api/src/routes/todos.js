const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
  completed: z.boolean().optional(),
});

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
  res.json(todos);
});

router.get('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  res.json(todo);
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const todo = await prisma.todo.create({ data: parse.data });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.put('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: parse.data,
    });
    res.json(todo);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Todo not found' });
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    await prisma.todo.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Todo not found' });
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
