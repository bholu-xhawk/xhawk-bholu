const express = require('express');
const { buildAuthRouter } = require('./routes/auth');
const { buildUsersRouter } = require('./routes/users');

function createApp() {
  const app = express();

  // Basic JSON parsing
  app.use(express.json());

  // Basic CORS: allow all origins
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });

  // Routers
  app.use('/api/auth', buildAuthRouter());
  app.use('/api/users', buildUsersRouter());

  // 404 for unmatched API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'not_found', message: 'API route not found' });
    }
    next();
  });

  // Centralized error handler
  // Expect errors like { status, code, message, details }
  app.use((err, req, res, next) => {
    if (!err) return next();
    const status = err.status || 500;
    const payload = {
      error: err.code || (status === 500 ? 'internal_error' : 'error'),
      message: err.message || 'An error occurred',
    };
    if (err.details) payload.details = err.details;
    res.status(status).json(payload);
  });

  return app;
}

module.exports = { createApp };
