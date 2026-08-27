const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const todoSelect = {
  id: true,
  title: true,
  completed: true,
  createdAt: true,
  updatedAt: true,
};

const createTodoSchema = z
  .object({
    title: z.string().trim().min(1),
  })
  .strict();

const updateTodoSchema = z
  .object({
    completed: z.boolean(),
  })
  .strict();

function parseId(idParam) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.use('/todos', auth);

router.get('/todos', async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id },
      select: todoSelect,
      orderBy: { id: 'asc' },
    });

    return res.json(todos);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list todos' });
  }
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(422)
      .json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  try {
    const todo = await prisma.todo.create({
      data: { title: parse.data.title, userId: req.user.id },
      select: todoSelect,
    });

    return res.status(201).json(todo);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.patch('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(422)
      .json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  try {
    const result = await prisma.todo.updateMany({
      where: { id, userId: req.user.id },
      data: { completed: parse.data.completed },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const todo = await prisma.todo.findFirst({
      where: { id, userId: req.user.id },
      select: todoSelect,
    });

    return res.json(todo);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const result = await prisma.todo.deleteMany({
      where: { id, userId: req.user.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
