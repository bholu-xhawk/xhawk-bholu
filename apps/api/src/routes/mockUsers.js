const express = require('express');

const router = express.Router();

const users = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 2, name: 'Grace Hopper', email: 'grace@example.com' },
  { id: 3, name: 'Katherine Johnson', email: 'katherine@example.com' },
];

router.get('/users', (req, res) => {
  res.json(users);
});

module.exports = router;
