const express = require('express');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

function createApp() {
  const app = express();
  app.use(express.json());

  // Health
  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // Routes
  app.use(authRouter);
  app.use(usersRouter);

  // 404
  app.use((req, res, next) => {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    return res.status(status).json({ success: false, error: { code: 'INTERNAL', message } });
  });

  return app;
}

module.exports = { createApp };
