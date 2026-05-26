const express = require('express');
const cors = require('cors');
const { migrate } = require('./db');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

migrate();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

module.exports = app;

