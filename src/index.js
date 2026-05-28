const express = require('express');
const { initDb, createUser, getUserById, getUserByEmail, listUsers, updateUser, deleteUser } = require('./db');
const { hashPassword, verifyPassword, signToken, authenticate } = require('./auth');

initDb();

const app = express();
app.use(express.json());

function sanitizeUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(422).json({ error: 'Email already in use' });
    }
    const password_hash = await hashPassword(password);
    const user = createUser({ email, password_hash, name });
    const token = signToken({ id: user.id, email: user.email });
    return res.status(201).json({ user: sanitizeUser(user), token });
  } catch (e) {
    console.error('Signup error', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken({ id: user.id, email: user.email });
    return res.json({ user: sanitizeUser(user), token });
  } catch (e) {
    console.error('Login error', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Authenticated routes
app.get('/api/users', authenticate, (req, res) => {
  try {
    const users = listUsers();
    return res.json({ users });
  } catch (e) {
    console.error('List users error', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/users/:id', authenticate, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const user = getUserById(id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json({ user: sanitizeUser(user) });
  } catch (e) {
    console.error('Get user error', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/api/users/:id', authenticate, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { email, name } = req.body || {};
    if (email === undefined && name === undefined) {
      return res.status(400).json({ error: 'At least one of email or name must be provided' });
    }
    // Attempt update, handle unique constraints
    try {
      const updated = updateUser(id, { email, name });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json({ user: sanitizeUser(updated) });
    } catch (err) {
      if (String(err).includes('UNIQUE') || String(err).toLowerCase().includes('unique')) {
        return res.status(422).json({ error: 'Email already in use' });
      }
      throw err;
    }
  } catch (e) {
    console.error('Update user error', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/users/:id', authenticate, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const ok = deleteUser(id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    return res.status(204).send();
  } catch (e) {
    console.error('Delete user error', e);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
