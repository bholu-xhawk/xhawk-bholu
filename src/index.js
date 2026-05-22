const express = require('express');
const { migrate } = require('./db');
const { configureAuthRoutes } = require('./routes/auth');
const { configureUserRoutes } = require('./routes/users');

function createApp() {
  // Ensure DB schema is ready both for server and tests
  migrate();

  const app = express();

  // JSON body parser with error handler for malformed JSON
  app.use(express.json());
  app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON' });
    }
    next(err);
  });

  // Basic health
  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // Routes
  configureAuthRoutes(app);
  configureUserRoutes(app);

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler
  app.use((err, req, res, next) => {
    if (err && err.status) {
      return res.status(err.status).json({ error: err.message, details: err.details });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

async function startServer() {
  migrate();
  const app = createApp();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp };

