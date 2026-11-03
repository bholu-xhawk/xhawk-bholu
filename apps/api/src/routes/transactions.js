const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const transactionSelect = {
  id: true,
  type: true,
  amountCents: true,
  category: true,
  description: true,
  occurredAt: true,
  createdAt: true,
  updatedAt: true,
};

const transactionTypes = ['income', 'expense'];

const positiveIntegerId = (raw) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Invalid timestamp',
}).transform((value) => new Date(value));

const createTransactionSchema = z.object({
  type: z.enum(transactionTypes),
  amountCents: z.number().int().positive(),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  occurredAt: dateString,
}).strict();

const updateTransactionSchema = z.object({
  type: z.enum(transactionTypes).optional(),
  amountCents: z.number().int().positive().optional(),
  category: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  occurredAt: dateString.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

router.use(auth);

router.get('/transactions', async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    select: transactionSelect,
    orderBy: [
      { occurredAt: 'desc' },
      { id: 'desc' },
    ],
  });
  res.json(transactions);
});

router.get('/transactions/:id', async (req, res) => {
  const id = positiveIntegerId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: req.user.id },
    select: transactionSelect,
  });
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

  res.json(transaction);
});

router.post('/transactions', async (req, res) => {
  const parse = createTransactionSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const transaction = await prisma.transaction.create({
    data: {
      ...parse.data,
      userId: req.user.id,
    },
    select: transactionSelect,
  });

  res.status(201).json(transaction);
});

router.put('/transactions/:id', async (req, res) => {
  const id = positiveIntegerId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTransactionSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const updated = await prisma.transaction.updateMany({
    where: { id, userId: req.user.id },
    data: parse.data,
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Transaction not found' });

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: req.user.id },
    select: transactionSelect,
  });

  res.json(transaction);
});

router.delete('/transactions/:id', async (req, res) => {
  const id = positiveIntegerId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const deleted = await prisma.transaction.deleteMany({
    where: { id, userId: req.user.id },
  });
  if (deleted.count === 0) return res.status(404).json({ error: 'Transaction not found' });

  res.status(204).send();
});

module.exports = router;
