const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

const todoSelect = {
  id: true,
  title: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
};

const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
});

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').optional(),
    completed: z.boolean().optional(),
  })
  .strict()
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: 'At least one field must be provided',
  });

function parseId(id) {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

router.use(auth);

router.get('/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    select: todoSelect,
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
  });

  res.json({ todos });
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid todo', details: parse.error.flatten() });
  }

  const todo = await prisma.todo.create({
    data: {
      title: parse.data.title,
      userId: req.user.id,
    },
    select: todoSelect,
  });

  res.status(201).json({ todo });
});

router.patch('/todos/complete-all', async (req, res) => {
  const result = await prisma.todo.updateMany({
    where: { userId: req.user.id, completed: false },
    data: { completed: true },
  });

  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    select: todoSelect,
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
  });

  res.json({ updatedCount: result.count, todos });
});

router.patch('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid todo update', details: parse.error.flatten() });
  }

  const existing = await prisma.todo.findFirst({
    where: { id, userId: req.user.id },
    select: { id: true },
  });

  if (!existing) return res.status(404).json({ error: 'Todo not found' });

  const todo = await prisma.todo.update({
    where: { id },
    data: parse.data,
    select: todoSelect,
  });

  res.json({ todo });
});

module.exports = router;
