import express from 'express';
import { createUser, getUserByEmail, verifyPassword, stripSensitive } from '../store/users.js';
import { signToken } from '../middleware/auth.js';

// Endpoints: POST /api/auth/signup, POST /api/auth/login
// POST /api/auth/login
const router = express.Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, isAdmin } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await createUser({ email, password, isAdmin: !!isAdmin });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const userRecord = await getUserByEmail(email);
    if (!userRecord) {
      return res.status(422).json({ error: 'Invalid credentials' });
    }
    const ok = await verifyPassword(userRecord, password);
    if (!ok) {
      return res.status(422).json({ error: 'Invalid credentials' });
    }
    const user = stripSensitive(userRecord);
    const token = signToken(userRecord);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
});

export default router;
