const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const parsePositiveInteger = (value, defaultValue) => {
  if (value === undefined) return defaultValue;
  if (Array.isArray(value)) return null;
  if (!/^\d+$/.test(String(value))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
};

const getEmailDomain = (email) => email.split('@')[1] || '';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(8),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
});

router.get('/users/directory', async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 1);
  const pageSize = parsePositiveInteger(req.query.pageSize, 20);

  if (page === null || pageSize === null || pageSize > 100) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, name: true },
      orderBy: { id: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count(),
  ]);

  res.json({
    data: users.map((user) => ({
      id: user.id,
      name: user.name,
      emailDomain: getEmailDomain(user.email),
    })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  });
});

router.use(auth);

router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    orderBy: { id: 'asc' },
  });
  res.json(users);
});

router.get('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/users', async (req, res) => {
  const parse = createUserSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const { email, name, password } = parse.data;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(422).json({ error: 'Email already in use' });
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const parse = updateUserSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const { email, name, password } = parse.data;

  const data = {};
  if (email !== undefined) data.email = email;
  if (name !== undefined) data.name = name;
  if (password !== undefined) {
    const bcrypt = require('bcrypt');
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    if (err.code === 'P2002') return res.status(422).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
