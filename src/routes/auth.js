const express = require('express');
const router = express.Router();
const { validate, signupSchema, loginSchema } = require('../validators');
const { getUserByEmail, getUserWithPasswordByEmail, createUser } = require('../db');
const { hashPassword, verifyPassword, createToken } = require('../auth');

router.post('/api/signup', validate(signupSchema), async (req, res) => {
  try {
    const { email, password, name } = req.validated;
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Email already registered' } });
    }
    const password_hash = await hashPassword(password);
    const user = createUser({ email, password_hash, name });
    const token = createToken({ id: user.id, role: user.role });
    return res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
  }
});

router.post('/api/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validated;
    const userRow = getUserWithPasswordByEmail(email);
    if (!userRow) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }
    const ok = await verifyPassword(password, userRow.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }
    const { password_hash, ...user } = userRow;
    const token = createToken({ id: user.id, role: user.role });
    return res.json({ success: true, data: { token, user } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } });
  }
});

module.exports = router;
