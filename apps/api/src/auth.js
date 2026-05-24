import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { db } from './db.js';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_NAME = 'token';
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const router = express.Router();

// Make sure cookie parser is used when mounting this router if not globally
router.use(cookieParser());

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

export function setAuthCookie(res, token) {
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(TOKEN_NAME, { path: '/' });
}

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[TOKEN_NAME];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional().default(''),
});

router.post('/signup', (req, res) => {
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'ValidationError', details: parse.error.flatten() });
  }
  const { email, password, name } = parse.data;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(422).json({ error: 'EmailExists' });
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO users (email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(email, password_hash, name || null, now, now);
  const user = db.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = signToken(user);
  setAuthCookie(res, token);
  return res.status(201).json({ user });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'ValidationError', details: parse.error.flatten() });
  }
  const { email, password } = parse.data;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'InvalidCredentials' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'InvalidCredentials' });
  const publicUser = { id: user.id, email: user.email, name: user.name, created_at: user.created_at, updated_at: user.updated_at };
  const token = signToken(publicUser);
  setAuthCookie(res, token);
  return res.json({ user: publicUser });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'NotFound' });
  res.json({ user });
});

export const authRouter = router;
