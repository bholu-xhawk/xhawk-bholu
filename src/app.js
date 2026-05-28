const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/users', require('./routes/users'));

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err); // eslint-disable-line no-console
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
