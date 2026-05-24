import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter, requireAuth } from './auth.js';
import { usersRouter } from './users.js';

export const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/users', requireAuth, usersRouter);

// Health endpoint
app.get('/healthz', (req, res) => res.json({ ok: true }));

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (!err) return next();
  const status = err.status || err.code || 500;
  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
    return res.status(status).json({ error: err.name || 'Error', message: err.message });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'InternalServerError' });
});
