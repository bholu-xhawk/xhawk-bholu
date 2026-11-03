const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');
const financeStore = require('../data/financeStore');

const router = express.Router();

const accountSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum([...financeStore.accountTypes]),
  balance: z.number().finite(),
}).strict();

const updateAccountSchema = accountSchema.partial().refine((data) => Object.keys(data).length > 0, {
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

router.get('/accounts', (req, res) => {
  res.json(financeStore.listAccounts(req.user.id));
});

router.get('/accounts/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const account = financeStore.getAccount(req.user.id, id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  return res.json(account);
});

router.post('/accounts', (req, res) => {
  const parse = accountSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const account = financeStore.createAccount(req.user.id, parse.data);
  return res.status(201).json(account);
});

router.put('/accounts/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const parse = updateAccountSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const account = financeStore.updateAccount(req.user.id, id, parse.data);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  return res.json(account);
});

router.delete('/accounts/:id', (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const result = financeStore.deleteAccount(req.user.id, id);
  if (result.status === 'not_found') return res.status(404).json({ error: 'Account not found' });
  if (result.status === 'conflict') return res.status(409).json({ error: 'Account is referenced by a transaction' });
  return res.status(204).send();
});

module.exports = router;
