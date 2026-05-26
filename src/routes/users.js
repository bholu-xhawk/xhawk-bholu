const express = require('express');
const { z } = require('zod');
const { verifyJWT } = require('../middleware/auth');
const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../models/user');

const router = express.Router();

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional().nullable(),
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().optional().nullable(),
});

router.use(verifyJWT);

router.get('/', (req, res) => {
  const limit = Math.max(0, parseInt(req.query.limit, 10) || 50);
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const users = listUsers({ limit, offset });
  return res.json({ items: users, limit, offset });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = getUserById(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json({ user });
});

router.post('/', (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  try {
    const user = createUser(parsed.data);
    return res.status(201).json({ user });
  } catch (err) {
    if (err.status === 422) {
      return res.status(422).json({ error: err.message, code: err.code || 'UNPROCESSABLE_ENTITY' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  try {
    const updated = updateUser(id, parsed.data);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: updated });
  } catch (err) {
    if (err.status === 422) {
      return res.status(422).json({ error: err.message, code: err.code || 'UNPROCESSABLE_ENTITY' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const ok = deleteUser(id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  return res.status(204).send();
});

module.exports = router;
