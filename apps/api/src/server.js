require('dotenv').config();
const express = require('express');
const mockUserRoutes = require('./routes/mockUsers');

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', mockUserRoutes);
app.use('/api', (req, res, next) => {
  require('./routes/auth')(req, res, next);
});
app.use('/api', (req, res, next) => {
  require('./routes/users')(req, res, next);
});

// 404 handler for /api
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

module.exports = app; // export for testing
