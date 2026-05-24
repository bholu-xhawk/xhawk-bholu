import express from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from './db.js';
import { requireAuth } from './auth.js';

const router = express.Router();

const idParam = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'BadRequest' });
  req.params.id = id;
  next();
};

const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional().default(''),
});

const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().optional(),
});

router.use(requireAuth);

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id, email, name, created_at, updated_at FROM users ORDER BY id ASC').all();
  res.json({ users });
});

router.get('/:id', idParam, (req, res) => {
  const user = db
    .prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?')
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: 'NotFound' });
  res.json({ user });
});

router.post('/', (req, res) => {
  const parse = userCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'ValidationError', details: parse.error.flatten() });
  const { email, password, name } = parse.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(422).json({ error: 'EmailExists' });
  const password_hash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(email, password_hash, name || null, now, now);
  const user = db.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ user });
});

router.put('/:id', idParam, (req, res) => {
  const parse = userUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'ValidationError', details: parse.error.flatten() });

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'NotFound' });

  const updateFields = [];
  const params = [];

  if (parse.data.email) {
    const dupe = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(parse.data.email, req.params.id);
    if (dupe) return res.status(422).json({ error: 'EmailExists' });
    updateFields.push('email = ?');
    params.push(parse.data.email);
  }
  if (parse.data.name !== undefined) {
    updateFields.push('name = ?');
    params.push(parse.data.name);
  }
  if (parse.data.password) {
    const hash = bcrypt.hashSync(parse.data.password, 10);
    updateFields.push('password_hash = ?');
    params.push(hash);
  }

  updateFields.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.params.id);

  if (updateFields.length === 1) {
    // only updated_at would change
    return res.json({ user: { id: existing.id, email: existing.email, name: existing.name, created_at: existing.created_at, updated_at: existing.updated_at } });
  }

  const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...params);
  const user = db.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
  res.json({ user });
});

router.delete('/:id', idParam, (req, res) => {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'NotFound' });
  res.json({ ok: true });
});

export const usersRouter = router;
