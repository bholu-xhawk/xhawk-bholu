const express = require('express');
const bcrypt = require('bcryptjs');
const { createUser, getUserByEmail } = require('../models/user');
const { issueToken } = require('../auth');

const router = express.Router();

function isValidEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.length <= 255;
}

function isValidPassword(pw) {
  return typeof pw === 'string' && pw.length >= 6 && pw.length <= 200;
}

router.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!isValidEmail(email) || !isValidPassword(password)) {
      return res.status(422).json({ error: 'Invalid email or password (min 6 chars)' });
    }
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(422).json({ error: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({ email, name, passwordHash });
    const token = issueToken(user);
    return res.status(201).json({ id: user.id, email: user.email, name: user.name, token });
  } catch (err) {
    console.error('Signup error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isValidEmail(email) || !isValidPassword(password)) {
      return res.status(422).json({ error: 'Invalid email or password' });
    }
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = issueToken(user);
    return res.json({ token });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;