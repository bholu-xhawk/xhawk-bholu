// Stub router: provides a dummy user creation endpoint without DB/auth
const express = require('express');

const router = express.Router();

// POST /api/users/dummy
// Accepts a user-like payload and returns a static confirmation.
// This endpoint is intended for testing/demo purposes and does not touch the database.
router.post('/users/dummy', (req, res) => {
  const { email, name } = req.body || {};
  const response = {
    id: 'dummy-1',
    email: email ?? null,
    name: name ?? null,
    message: 'User created (dummy)'
  };
  res.status(201).json(response);
});

module.exports = router;
