const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  role: z.string().optional(), // only honored for bootstrap (first user)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function normalizeRole(input) {
  if (!input) return null;
  const val = String(input).toUpperCase();
  if (["ADMIN", "USER", "GUEST"].includes(val)) return val;
  return null;
}

router.post('/auth/signup', async (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { email, password, name, role: requestedRoleRaw } = parse.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(422).json({ error: 'Email already in use' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine role: allow setting role only if this is the first user (bootstrap)
    let roleToSet = 'USER';
    const totalUsers = await prisma.user.count();
    if (totalUsers === 0) {
      const normalized = normalizeRole(requestedRoleRaw);
      if (normalized) roleToSet = normalized;
    }

    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: roleToSet },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    });
    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/auth/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.json({ token });
});

module.exports = router;

