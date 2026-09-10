const express = require('express');
const auth = require('../middleware/auth');
const { createTodoSchema, updateTodoSchema } = require('./todoSchemas');
const todoRepo = require('../repos/todos');

const router = express.Router();
const MAX_PRISMA_INT_ID = 2147483647;

function parseId(idParam) {
  if (!/^\d+$/.test(idParam)) return null;

  const id = Number(idParam);
  return id > 0 && id <= MAX_PRISMA_INT_ID ? id : null;
}

router.use('/todos', auth);

router.get('/todos', async (req, res) => {
  try {
    const todos = await todoRepo.listTodos(req.user.id);

    return res.json(todos);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list todos' });
  }
});

router.post('/todos', async (req, res) => {
  const parse = createTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(422)
      .json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  try {
    const todo = await todoRepo.createTodo(req.user.id, parse.data.title);

    return res.status(201).json(todo);
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(401).json({ error: 'Invalid user' });
    }

    return res.status(500).json({ error: 'Failed to create todo' });
  }
});

router.patch('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTodoSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(422)
      .json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  try {
    const todo = await todoRepo.updateTodoCompleted(
      req.user.id,
      id,
      parse.data.completed
    );

    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    return res.json(todo);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

router.delete('/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    const deleted = await todoRepo.deleteTodo(req.user.id, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});

module.exports = router;
