const express = require('express');
const router = express.Router();
const store = require('../data/usersStore');

router.get('/', async (req, res, next) => {
  try {
    const users = await store.loadUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email } = req.body || {};
    const user = await store.createUser({ name, email });
    res.status(201).json(user);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email } = req.body || {};
    const updated = await store.updateUser(req.params.id, { name, email });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await store.deleteUser(req.params.id);
    if (!ok) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
