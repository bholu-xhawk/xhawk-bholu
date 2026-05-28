const express = require('express');
const router = express.Router();
const { requireAuth, requireRole, hashPassword } = require('../auth');
const { validate, userUpdateSchema } = require('../validators');
const { getUserById, listUsers, updateUser, deleteUser } = require('../db');

// Self endpoints
router.get('/api/users/me', requireAuth, (req, res) => {
  return res.json({ success: true, data: req.user });
});

router.patch('/api/users/me', requireAuth, validate(userUpdateSchema.pick({ email: true, password: true, name: true })), async (req, res) => {
  try {
    const updates = { ...req.validated };
    if (updates.password) {
      updates.password_hash = await hashPassword(updates.password);
      delete updates.password;
    }
    const updated = updateUser(req.user.id, updates);
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
  }
});

router.delete('/api/users/me', requireAuth, (req, res) => {
  try {
    const ok = deleteUser(req.user.id);
    if (!ok) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
  }
});

// Admin endpoints
router.get('/api/users', requireAuth, requireRole('admin'), (req, res) => {
  const users = listUsers();
  return res.json({ success: true, data: users });
});

router.get('/api/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  const user = getUserById(Number(req.params.id));
  if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
  return res.json({ success: true, data: user });
});

router.patch('/api/users/:id', requireAuth, requireRole('admin'), validate(userUpdateSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = { ...req.validated };
    if (updates.password) {
      updates.password_hash = await hashPassword(updates.password);
      delete updates.password;
    }
    const updated = updateUser(id, updates);
    if (!updated) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
  }
});

router.delete('/api/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const ok = deleteUser(id);
    if (!ok) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    return res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
  }
});

module.exports = router;
