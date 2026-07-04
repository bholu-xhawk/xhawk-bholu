const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const createTodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

const selectFields = { id: true, title: true, description: true, done: true, createdAt: true, updatedAt: true };

router.use(auth);

router.get('/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    select: selectFields,
    orderBy: { id: 'asc' },
  });
  res.json(todos);
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { title, description } = parse.data;
  try {
    const todo = await prisma.todo.create({
      data: { title, description, userId: req.user.id },
      select: selectFields,
    });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.put('/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { title, description } = parse.data;

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;

  const owned = await prisma.todo.findFirst({ where: { id, userId: req.user.id } });
  if (!owned) return res.status(404).json({ error: 'Todo not found' });

  try {
    const updated = await prisma.todo.update({ where: { id }, data, select: selectFields });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Todo not found' });
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.post('/todos/:id/done', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

  const owned = await prisma.todo.findFirst({ where: { id, userId: req.user.id } });
  if (!owned) return res.status(404).json({ error: 'Todo not found' });

  try {
    const updated = await prisma.todo.update({ where: { id }, data: { done: true }, select: selectFields });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Todo not found' });
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

module.exports = router;
