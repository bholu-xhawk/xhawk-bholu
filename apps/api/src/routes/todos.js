const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const createTodoSchema = z.object({
  title: z.string().trim().min(1),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).nonempty(),
});

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({
    orderBy: { id: 'asc' },
  });
  res.json(todos);
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const todo = await prisma.todo.create({
      data: { title: parse.data.title },
    });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.delete('/todos/:id', async (req, res) => {
  const id = parsePositiveId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    await prisma.todo.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Todo not found' });
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

router.delete('/todos', async (req, res) => {
  const parse = bulkDeleteSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const result = await prisma.todo.deleteMany({
      where: { id: { in: parse.data.ids } },
    });
    res.json({ deletedCount: result.count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todos' });
  }
});

module.exports = router;
