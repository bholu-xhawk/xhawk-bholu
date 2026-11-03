const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const titleSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1));

const createTodoSchema = z.object({
  title: titleSchema,
});

const updateTodoSchema = z
  .object({
    title: titleSchema.optional(),
    completed: z.boolean().optional(),
  })
  .strict()
  .refine((data) => data.title !== undefined || data.completed !== undefined, {
    message: 'At least one field is required',
  });

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function listOwnedTodos(userId) {
  return prisma.todo.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

router.use(auth);

router.get('/todos', async (req, res) => {
  const todos = await listOwnedTodos(req.user.id);
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
  });

  res.status(201).json(todo);
});

router.patch('/todos/complete-all', async (req, res) => {
  await prisma.todo.updateMany({
    where: { userId: req.user.id, completed: false },
    data: { completed: true },
  });

  const todos = await listOwnedTodos(req.user.id);
  res.json(todos);
});

router.patch('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const result = await prisma.todo.updateMany({
    where: { id, userId: req.user.id },
    data: parse.data,
  });

  if (result.count === 0) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const todo = await prisma.todo.findUnique({ where: { id } });
  res.json(todo);
});

module.exports = router;
