const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const prisma = require('../prisma');

const router = express.Router();

const titleSchema = z.string().trim().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer');
const createTodoSchema = z.object({
  title: titleSchema,
});
const updateTodoSchema = z
  .object({
    title: titleSchema.optional(),
    completed: z.boolean().optional(),
  })
  .refine((value) => value.title !== undefined || value.completed !== undefined, {
    message: 'At least one field is required',
  });

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function todoSelect() {
  return {
    id: true,
    title: true,
    completed: true,
    createdAt: true,
    updatedAt: true,
  };
}

router.use(auth);

router.get('/todos', async (req, res, next) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.id },
      select: todoSelect(),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    res.json(todos);
  } catch (err) {
    next(err);
  }
});

router.post('/todos', async (req, res, next) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  try {
    const todo = await prisma.todo.create({
      data: {
        title: parse.data.title,
        userId: req.user.id,
      },
      select: todoSelect(),
    });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
});

router.patch('/todos/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const data = {};
  if (parse.data.title !== undefined) data.title = parse.data.title;
  if (parse.data.completed !== undefined) data.completed = parse.data.completed;

  try {
    const result = await prisma.todo.updateMany({
      where: { id, userId: req.user.id },
      data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Todo not found' });

    const todo = await prisma.todo.findFirst({
      where: { id, userId: req.user.id },
      select: todoSelect(),
    });
    res.json(todo);
  } catch (err) {
    next(err);
  }
});

router.delete('/todos/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const result = await prisma.todo.deleteMany({
      where: { id, userId: req.user.id },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Todo not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
