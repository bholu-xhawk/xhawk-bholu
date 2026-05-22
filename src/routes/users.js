const { getDb, toUserRow } = require('../db');
const { parseBody, updateUserSchema } = require('../validation');
const { requireAuth } = require('../middleware/auth');

function configureUserRoutes(app) {
  const db = getDb();

  app.get('/api/users/me', requireAuth, (req, res) => {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!row) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: toUserRow(row) });
  });

  app.patch('/api/users/me', requireAuth, (req, res) => {
    let data;
    try {
      data = parseBody(updateUserSchema, req.body);
    } catch (e) {
      return res.status(e.status || 422).json({ error: e.message, details: e.details });
    }

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const newEmail = data.email !== undefined ? data.email : existing.email;
    const newName = data.name !== undefined ? data.name : existing.name;

    try {
      const stmt = db.prepare('UPDATE users SET email = ?, name = ?, updated_at = ? WHERE id = ?');
      stmt.run(newEmail, newName, now, req.user.id);
    } catch (e) {
      if (e && (e.code === 'SQLITE_CONSTRAINT' || e.code === 'SQLITE_CONSTRAINT_UNIQUE')) {
        return res.status(422).json({ error: 'Email already in use' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    return res.json({ user: toUserRow(row) });
  });

  app.delete('/api/users/me', requireAuth, (req, res) => {
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
    return res.status(204).send();
  });
}

module.exports = { configureUserRoutes };
