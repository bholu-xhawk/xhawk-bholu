const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const todoSelect = {
  id: true,
  title: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
};

const nonBlankTitle = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1, 'Title is required'));

const createTodoSchema = z
  .object({
    title: nonBlankTitle,
  })
  .strict();

const updateTodoSchema = z
  .object({
    title: nonBlankTitle.optional(),
    completed: z.boolean().optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.completed !== undefined, {
    message: 'At least one field is required',
  });

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({
    select: todoSelect,
    orderBy: { id: 'asc' },
  });
  res.json(todos);
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  try {
    const todo = await prisma.todo.create({
      data: { title: parse.data.title },
      select: todoSelect,
    });
    return res.status(201).json(todo);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.put('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  try {
    const updated = await prisma.todo.update({
      where: { id },
      data: parse.data,
      select: todoSelect,
    });
    return res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Todo not found' });
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    await prisma.todo.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Todo not found' });
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
