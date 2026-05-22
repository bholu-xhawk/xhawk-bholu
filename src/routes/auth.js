const { getDb, toUserRow } = require('../db');
const { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } = require('../auth');
const { parseBody, signupSchema, loginSchema, refreshSchema } = require('../validation');

function configureAuthRoutes(app) {
  const db = getDb();

  app.post('/api/auth/signup', async (req, res) => {
    let data;
    try {
      data = parseBody(signupSchema, req.body);
    } catch (e) {
      return res.status(e.status || 422).json({ error: e.message, details: e.details });
    }
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(data.password);
    try {
      const stmt = db.prepare(
        'INSERT INTO users (email, name, password_hash, token_version, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)'
      );
      const info = stmt.run(data.email, data.name || null, passwordHash, now, now);
      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
      const user = toUserRow(userRow);
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      return res.status(201).json({ user, accessToken, refreshToken });
    } catch (e) {
      if (e && (e.code === 'SQLITE_CONSTRAINT' || e.code === 'SQLITE_CONSTRAINT_UNIQUE')) {
        return res.status(422).json({ error: 'Email already in use' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    let data;
    try {
      data = parseBody(loginSchema, req.body);
    } catch (e) {
      return res.status(e.status || 422).json({ error: e.message, details: e.details });
    }
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
    if (!userRow) {
      return res.status(404).json({ error: 'Invalid credentials' });
    }
    const ok = await verifyPassword(userRow.password_hash, data.password);
    if (!ok) {
      return res.status(404).json({ error: 'Invalid credentials' });
    }
    const user = toUserRow(userRow);
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    return res.json({ user, accessToken, refreshToken });
  });

  app.post('/api/auth/refresh', (req, res) => {
    let data;
    try {
      data = parseBody(refreshSchema, req.body);
    } catch (e) {
      return res.status(e.status || 422).json({ error: e.message, details: e.details });
    }
    try {
      const payload = verifyRefreshToken(data.refreshToken);
      const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
      if (!userRow) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (userRow.token_version !== payload.tv) {
        return res.status(422).json({ error: 'Refresh token is no longer valid' });
      }
      const user = toUserRow(userRow);
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      return res.json({ user, accessToken, refreshToken });
    } catch (e) {
      return res.status(422).json({ error: 'Invalid or expired refresh token' });
    }
  });
}

module.exports = { configureAuthRoutes };
