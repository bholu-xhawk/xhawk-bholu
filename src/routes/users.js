const express = require('express');
const router = express.Router();
const store = require('../store/usersStore');

// List users
router.get('/', (req, res) => {
  const users = store.listUsers();
  res.json(users);
});

// Get user by ID
router.get('/:id', (req, res) => {
  const user = store.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Create user
router.post('/', (req, res) => {
  const { name, email, ...rest } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const user = store.createUser({ name, email, extra: rest });
  res.status(201).json(user);
});

// Update user
router.put('/:id', (req, res) => {
  const updates = { ...req.body };
  // Prevent changing id/createdAt directly
  delete updates.id;
  delete updates.createdAt;
  const updated = store.updateUser(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(updated);
});

// Delete user
router.delete('/:id', (req, res) => {
  const ok = store.deleteUser(req.params.id);
  if (!ok) return res.status(404).json({ error: 'User not found' });
  res.status(204).send();
});

module.exports = router;
