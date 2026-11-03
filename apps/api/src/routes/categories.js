const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const financeStore = require('../data/financeStore');

const router = express.Router();

const categorySchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum([...financeStore.categoryTypes]),
}).strict();

const updateCategorySchema = categorySchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return null;
  }
  return id;
}

router.use(auth);

router.get('/categories', (req, res) => {
  res.json(financeStore.listCategories(req.user.id));
});

router.get('/categories/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const category = financeStore.getCategory(req.user.id, id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  return res.json(category);
});

router.post('/categories', (req, res) => {
  const parse = categorySchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const category = financeStore.createCategory(req.user.id, parse.data);
  return res.status(201).json(category);
});

router.put('/categories/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const parse = updateCategorySchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const category = financeStore.updateCategory(req.user.id, id, parse.data);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  return res.json(category);
});

router.delete('/categories/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const result = financeStore.deleteCategory(req.user.id, id);
  if (result.status === 'not_found') return res.status(404).json({ error: 'Category not found' });
  if (result.status === 'conflict') return res.status(409).json({ error: 'Category is referenced by a transaction' });
  return res.status(204).send();
});

module.exports = router;
