const express = require('express');
const { z } = require('zod');

const router = express.Router();

// In-memory mock store
let users = [];
let nextId = 1;

// Schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  password: z.string().min(8),
});

const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().nullable().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// Helpers
function parseId(param) {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function findUserIndexById(id) {
  return users.findIndex((u) => u.id === id);
}

// Routes
// Create
router.post('/mock/users', (req, res) => {
  const parse = createUserSchema.safeParse(req.body);
  if (!parse.success)
    return res
      .status(422)
      .json({ error: 'Invalid input', details: parse.error.flatten() });

  const { email, name } = parse.data;

  const exists = users.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) return res.status(422).json({ error: 'Email already in use' });

  const now = new Date().toISOString();
  const user = {
    id: nextId++,
    email,
    name: name ?? null,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  res.status(201).json(user);
});

// Read
router.get('/mock/users/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const user = users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update
router.put('/mock/users/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateUserSchema.safeParse(req.body);
  if (!parse.success)
    return res
      .status(422)
      .json({ error: 'Invalid input', details: parse.error.flatten() });

  const idx = findUserIndexById(id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  const { email, name } = parse.data;

  if (email !== undefined) {
    const taken = users.some(
      (u) => u.id !== id && u.email.toLowerCase() === email.toLowerCase()
    );
    if (taken) return res.status(422).json({ error: 'Email already in use' });
  }

  const updated = { ...users[idx] };
  if (email !== undefined) updated.email = email;
  if (name !== undefined) updated.name = name ?? null;
  updated.updatedAt = new Date().toISOString();

  users[idx] = updated;
  res.json(updated);
});

// Delete
router.delete('/mock/users/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const idx = findUserIndexById(id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });

  users.splice(idx, 1);
  res.status(204).send();
});

module.exports = router;
