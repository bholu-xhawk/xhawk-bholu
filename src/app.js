const express = require('express');
const usersRouter = require('./routes/users');

const app = express();
app.use(express.json());
app.use(usersRouter);

module.exports = app;
