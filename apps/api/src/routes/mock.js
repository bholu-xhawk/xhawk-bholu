const express = require('express');

const router = express.Router();

// Public mock endpoint for testing/demo purposes
router.get('/mock/user', (req, res) => {
  const payload = {
    id: 1,
    name: 'Mock User',
    email: 'mock.user@example.com',
    createdAt: new Date().toISOString(),
  };
  res.json(payload);
});

module.exports = router;
