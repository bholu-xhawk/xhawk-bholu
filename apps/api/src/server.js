require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const prisma = require('./prisma');

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ db: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'Database not reachable', details: err?.message || String(err) });
  }
});

app.use('/api', authRoutes);
app.use('/api', userRoutes);

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
