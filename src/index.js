const express = require('express');
const { ensureMigrations } = require('./db');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

ensureMigrations();

const app = express();
app.use(express.json());

app.use(authRouter);
app.use(usersRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

module.exports = app;

