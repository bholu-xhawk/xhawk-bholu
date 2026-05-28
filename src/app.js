const express = require('express');
const app = express();

app.use(express.json());

app.use('/api/users', require('./routes/users'));

// basic health endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
