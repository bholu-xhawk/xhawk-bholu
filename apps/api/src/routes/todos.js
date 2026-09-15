const express = require('express');

const router = express.Router();

const mockTodos = [
  { id: 1, title: 'Plan the first todo endpoint', completed: true },
  { id: 2, title: 'Wire the todos route into the API', completed: false },
  { id: 3, title: 'Add coverage for reading todos', completed: false },
];

router.get('/todos', (req, res) => {
  res.json(mockTodos.map((todo) => ({ ...todo })));
});

module.exports = router;
