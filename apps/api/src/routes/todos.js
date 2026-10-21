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
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
};

const statusValues = ['todo', 'in_progress', 'done'];
const priorityValues = ['low', 'medium', 'high'];

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Invalid date');

const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(statusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  due_date: dateOnlySchema.nullable().optional(),
});

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(statusValues).optional(),
    priority: z.enum(priorityValues).optional(),
    due_date: dateOnlySchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(statusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  search: z.string().trim().max(200).optional(),
  sort_by: z.enum(['due_date', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

function parseId(id) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function todoNotFound(res) {
  return res.status(404).json({ error: 'Todo not found' });
}

function normalizeTodo(todo) {
  return {
    ...todo,
    due_date: todo.dueDate ? todo.dueDate.toISOString().slice(0, 10) : null,
    created_at: todo.createdAt.toISOString(),
    updated_at: todo.updatedAt.toISOString(),
    dueDate: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

function buildData(input) {
  const data = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description || null;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (Object.prototype.hasOwnProperty.call(input, 'due_date')) {
    data.dueDate = input.due_date ? new Date(`${input.due_date}T00:00:00.000Z`) : null;
  }
  return data;
}

router.use(auth);

router.post('/todos', async (req, res, next) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const todo = await prisma.todo.create({
      data: { ...buildData(parse.data), userId: req.user.id },
      select: todoSelect,
    });
    return res.status(201).json(normalizeTodo(todo));
  } catch (err) {
    return next(err);
  }
});

router.get('/todos', async (req, res, next) => {
  const parse = listQuerySchema.safeParse(req.query);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const { page, page_size: pageSize, status, priority, search, sort_by: sortBy, sort_order: sortOrder } = parse.data;
  const where = { userId: req.user.id };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) where.title = { contains: search };

  const field = sortBy === 'due_date' ? 'dueDate' : 'createdAt';
  try {
    const [total, items] = await prisma.$transaction([
      prisma.todo.count({ where }),
      prisma.todo.findMany({
        where,
        select: todoSelect,
        orderBy: [{ [field]: sortOrder }, { id: sortOrder }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return res.json({ items: items.map(normalizeTodo), total, page, page_size: pageSize });
  } catch (err) {
    return next(err);
  }
});

router.get('/todos/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(422).json({ error: 'Invalid id' });

  try {
    const todo = await prisma.todo.findFirst({ where: { id, userId: req.user.id }, select: todoSelect });
    if (!todo) return todoNotFound(res);
    return res.json(normalizeTodo(todo));
  } catch (err) {
    return next(err);
  }
});

router.put('/todos/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(422).json({ error: 'Invalid id' });
  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const result = await prisma.todo.updateMany({ where: { id, userId: req.user.id }, data: buildData(parse.data) });
    if (result.count === 0) return todoNotFound(res);
    const todo = await prisma.todo.findFirst({ where: { id, userId: req.user.id }, select: todoSelect });
    return res.json(normalizeTodo(todo));
  } catch (err) {
    return next(err);
  }
});

router.delete('/todos/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(422).json({ error: 'Invalid id' });

  try {
    const result = await prisma.todo.deleteMany({ where: { id, userId: req.user.id } });
    if (result.count === 0) return todoNotFound(res);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
