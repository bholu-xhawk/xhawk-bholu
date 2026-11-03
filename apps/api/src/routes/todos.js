const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const todoSelect = {
  id: true,
  title: true,
  completed: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
};

const todoOrder = [{ createdAt: 'asc' }, { id: 'asc' }];

const titleSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'));

const createTodoSchema = z.object({
  title: titleSchema,
});

const updateTodoSchema = z
  .object({
    title: titleSchema.optional(),
    completed: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.completed !== undefined, {
    message: 'Provide a title or completed value',
  });

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.use(auth);

router.get('/todos', async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    select: todoSelect,
    orderBy: todoOrder,
  });
  res.json(todos);
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const todo = await prisma.todo.create({
    data: {
      title: parse.data.title,
      userId: req.user.id,
    },
    select: todoSelect,
  });

  return res.status(201).json(todo);
});

router.put('/todos/complete-all', async (req, res) => {
  await prisma.todo.updateMany({
    where: { userId: req.user.id, completed: false },
    data: { completed: true },
  });

  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    select: todoSelect,
    orderBy: todoOrder,
  });

  return res.json(todos);
});

router.put('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const existing = await prisma.todo.findFirst({
    where: { id, userId: req.user.id },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: 'Todo not found' });

  const data = {};
  if (parse.data.title !== undefined) data.title = parse.data.title;
  if (parse.data.completed !== undefined) data.completed = parse.data.completed;

  const todo = await prisma.todo.update({
    where: { id },
    data,
    select: todoSelect,
  });

  return res.json(todo);
});

module.exports = router;
