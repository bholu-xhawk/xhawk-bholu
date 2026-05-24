const express = require('express');
const { authMiddleware } = require('../auth');
const { listUsers, getUserById, updateUser, deleteUser, getUserByEmail } = require('../models/user');

const router = express.Router();

router.use(authMiddleware);

router.get('/api/users', (req, res) => {
  try {
    const users = listUsers();
    res.json(users);
  } catch (err) {
    console.error('List users error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = getUserById(id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err) {
    console.error('Get user error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/api/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { email, name } = req.body || {};
    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@') || email.length > 255) {
        return res.status(422).json({ error: 'Invalid email' });
      }
      const existing = getUserByEmail(email);
      if (existing && existing.id !== id) {
        return res.status(422).json({ error: 'Email already in use' });
      }
    }
    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 255) {
        return res.status(422).json({ error: 'Invalid name' });
      }
    }
    const current = getUserById(id);
    if (!current) return res.status(404).json({ error: 'Not found' });
    const updated = updateUser(id, { email, name });
    res.json(updated);
  } catch (err) {
    console.error('Update user error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/api/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ok = deleteUser(id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error('Delete user error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;