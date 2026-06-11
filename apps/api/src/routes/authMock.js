const express = require('express');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/mock/auth/signup
router.post('/mock/auth/signup', (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { email, name } = parse.data;
  const now = new Date().toISOString();
  const user = {
    id: 1,
    email,
    name: name || null,
    createdAt: now,
    updatedAt: now,
  };
  return res.status(201).json(user);
});

// POST /api/mock/auth/login
router.post('/mock/auth/login', (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { email } = parse.data;
  const token = jwt.sign({ id: 1, email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.json({ token });
});

module.exports = router;
