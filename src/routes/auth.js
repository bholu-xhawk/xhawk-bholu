const express = require('express');
const { z } = require('zod');
const { createUser, getUserByEmail, verifyPassword } = require('../models/user');
const { signToken } = require('../middleware/auth');

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/signup', (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  try {
    const user = createUser(parsed.data);
    const token = signToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    if (err.status === 422) {
      return res.status(422).json({ error: err.message, code: err.code || 'UNPROCESSABLE_ENTITY' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  const existing = getUserByEmail(parsed.data.email);
  if (!existing) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  const ok = verifyPassword(parsed.data.password, existing.password_hash);
  if (!ok) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }
  const user = { id: existing.id, email: existing.email, name: existing.name || null, created_at: existing.created_at, updated_at: existing.updated_at };
  const token = signToken(user);
  return res.status(200).json({ user, token });
});

module.exports = router;
