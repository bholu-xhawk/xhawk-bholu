require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { attachRequestError, createRequestLogger } = require('./middleware/requestLogger');

function createApp(options = {}) {
  const app = express();
  const requestLogger = options.requestLogger || createRequestLogger(options.requestLoggerOptions);

  app.use(requestLogger);
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  if (typeof options.configureRoutes === 'function') {
    options.configureRoutes(app);
  }

  app.use('/api', authRoutes);
  app.use('/api', userRoutes);

  // 404 handler for /api
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // centralized error handler
  app.use((err, req, res, next) => {
    attachRequestError(req, err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

const app = createApp();

const port = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

module.exports = app; // export for testing
module.exports.createApp = createApp;
