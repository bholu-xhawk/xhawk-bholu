const express = require('express');

const router = express.Router();

const todos = [
  { id: 1, title: 'Review mock TODO API', completed: false },
  { id: 2, title: 'Document TODO deletion behavior', completed: true },
  { id: 3, title: 'Exercise repeated deletion responses', completed: false },
];

router.delete('/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'TODO not found' });
  }

  const [todo] = todos.splice(index, 1);
  return res.status(200).json({
    message: 'TODO deleted successfully',
    todo,
  });
});

module.exports = router;
