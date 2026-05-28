const express = require('express');
const app = express();

app.use(express.json());

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

// Basic health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
