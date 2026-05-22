const express = require('express');
const bcrypt = require('bcryptjs');
const { signToken, requireAuth } = require('../auth');
const {
  createUser,
  getUserByEmail,
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
} = require('../db');

const router = express.Router();

function isValidEmail(email) {
  return typeof email === 'string' && /.+@.+\..+/.test(email);
}

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

// POST /api/signup
router.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string' || password.length < 6 || typeof name !== 'string' || !name.trim()) {
    return res.status(422).json({ error: 'Invalid input' });
  }
  try {
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(422).json({ error: 'Email already in use' });
    }
    const passwordHash = bcrypt.hashSync(password, 10);
    const user = createUser({ email, passwordHash, name: name.trim() });
    return res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(422).json({ error: 'Email already in use' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/login
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || typeof password !== 'string') {
    return res.status(422).json({ error: 'Invalid input' });
  }
  const user = getUserByEmail(email);
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Invalid email or password' });
  const token = signToken(user.id);
  return res.json({ token });
});

// GET /api/users
router.get('/api/users', requireAuth, (req, res) => {
  const users = listUsers().map(publicUser);
  return res.json(users);
});

// GET /api/users/:id
router.get('/api/users/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = getUserById(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(publicUser(user));
});

// PUT /api/users/:id
router.put('/api/users/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });
  const { name, password } = req.body || {};
  if ((name !== undefined && (typeof name !== 'string' || !name.trim())) || (password !== undefined && (typeof password !== 'string' || password.length < 6))) {
    return res.status(422).json({ error: 'Invalid input' });
  }
  const passwordHash = password ? bcrypt.hashSync(password, 10) : undefined;
  const updated = updateUser(id, { name: name !== undefined ? name.trim() : undefined, passwordHash });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  return res.json(publicUser(updated));
});

// DELETE /api/users/:id
router.delete('/api/users/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });
  const ok = deleteUser(id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  return res.status(204).send();
});

module.exports = router;
