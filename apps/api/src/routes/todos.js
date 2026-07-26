const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const todoSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const statusSchema = z.enum(['pending', 'completed']);

const createTodoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: statusSchema.default('pending'),
});

const updateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: statusSchema.optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.use(auth);

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const todo = await prisma.todo.create({
    data: {
      title: parse.data.title,
      description: parse.data.description,
      status: parse.data.status,
      userId: req.user.id,
    },
    select: todoSelect,
  });

  res.status(201).json(todo);
});

router.get('/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    select: todoSelect,
    orderBy: { id: 'asc' },
  });

  res.json(todos);
});

router.get('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const todo = await prisma.todo.findFirst({
    where: { id, userId: req.user.id },
    select: todoSelect,
  });

  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

router.put('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const existing = await prisma.todo.findFirst({
    where: { id, userId: req.user.id },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: 'Todo not found' });

  const updated = await prisma.todo.update({
    where: { id },
    data: parse.data,
    select: todoSelect,
  });

  res.json(updated);
});

router.delete('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const existing = await prisma.todo.findFirst({
    where: { id, userId: req.user.id },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: 'Todo not found' });

  await prisma.todo.delete({ where: { id } });
  res.status(204).send();
});

module.exports = router;
