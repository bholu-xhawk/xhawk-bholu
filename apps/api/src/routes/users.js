import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { listUsers, getUserById, getUserRecordById, updateUser, deleteUser, stripSensitive } from '../store/users.js';

// Endpoints: GET /api/users, GET /api/users/:id, PATCH /api/users/:id, DELETE /api/users/:id
const router = express.Router();

function canAccess(reqUser, targetUserId) {
  return reqUser.isAdmin || reqUser.id === targetUserId;
}

router.get('/', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!canAccess(req.user, id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const user = await getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!canAccess(req.user, id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const allowed = {};
    const { email, password } = req.body || {};
    if (email !== undefined) allowed.email = email;
    if (password !== undefined) allowed.password = password;
    if (req.user.isAdmin && typeof req.body?.isAdmin !== 'undefined') {
      allowed.isAdmin = !!req.body.isAdmin;
    }
    const updated = await updateUser(id, allowed);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!canAccess(req.user, id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const ok = await deleteUser(id);
    if (!ok) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
