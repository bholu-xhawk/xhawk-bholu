const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const financeStore = require('../data/financeStore');

const router = express.Router();

const isoDateTime = z.string().datetime({ offset: true });

const transactionSchema = z.object({
  accountId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  type: z.enum([...financeStore.categoryTypes]),
  amount: z.number().finite().positive(),
  description: z.string().optional(),
  date: isoDateTime,
}).strict();

const updateTransactionSchema = transactionSchema.partial().refine((data) => Object.keys(data).length > 0, {
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

function handleRelationshipError(res, result) {
  if (result.status === 'missing_reference') {
    return res.status(404).json({ error: 'Referenced account or category not found' });
  }
  if (result.status === 'category_type_mismatch') {
    return res.status(422).json({ error: 'Category type must match transaction type' });
  }
  return null;
}

router.use(auth);

router.get('/transactions', (req, res) => {
  res.json(financeStore.listTransactions(req.user.id));
});

router.get('/transactions/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const transaction = financeStore.getTransaction(req.user.id, id);
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
  return res.json(transaction);
});

router.post('/transactions', (req, res) => {
  const parse = transactionSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const result = financeStore.createTransaction(req.user.id, parse.data);
  const relationshipResponse = handleRelationshipError(res, result);
  if (relationshipResponse) return relationshipResponse;
  return res.status(201).json(result.transaction);
});

router.put('/transactions/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const parse = updateTransactionSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const result = financeStore.updateTransaction(req.user.id, id, parse.data);
  if (result.status === 'not_found') return res.status(404).json({ error: 'Transaction not found' });
  const relationshipResponse = handleRelationshipError(res, result);
  if (relationshipResponse) return relationshipResponse;
  return res.json(result.transaction);
});

router.delete('/transactions/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const result = financeStore.deleteTransaction(req.user.id, id);
  if (result.status === 'not_found') return res.status(404).json({ error: 'Transaction not found' });
  return res.status(204).send();
});

module.exports = router;
