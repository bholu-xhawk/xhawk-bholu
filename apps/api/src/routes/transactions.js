const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const transactionSelect = {
  id: true,
  userId: true,
  amountCents: true,
  type: true,
  category: true,
  description: true,
  occurredAt: true,
  createdAt: true,
  updatedAt: true,
};

const isoDateTime = z.string().datetime({ offset: true }).transform((value) => new Date(value));

const createTransactionSchema = z.object({
  amountCents: z.number().int().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable().optional(),
  occurredAt: isoDateTime,
}).strict();

const updateTransactionSchema = z.object({
  amountCents: z.number().int().positive().optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  occurredAt: isoDateTime.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function currentUserId(req) {
  const userId = Number(req.user?.id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

router.use(auth);

router.get('/transactions', async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: transactionSelect,
      orderBy: [{ occurredAt: 'desc' }, { id: 'asc' }],
    });
    return res.json(transactions);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list transactions' });
  }
});

router.get('/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      select: transactionSelect,
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    return res.json(transaction);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read transaction' });
  }
});

router.post('/transactions', async (req, res) => {
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
  const parse = createTransactionSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const transaction = await prisma.transaction.create({
      data: { ...parse.data, userId },
      select: transactionSelect,
    });
    return res.status(201).json(transaction);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });
  const parse = updateTransactionSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const result = await prisma.transaction.updateMany({
      where: { id, userId },
      data: parse.data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Transaction not found' });

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      select: transactionSelect,
    });
    return res.json(transaction);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const userId = currentUserId(req);
  if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });

  try {
    const result = await prisma.transaction.deleteMany({ where: { id, userId } });
    if (result.count === 0) return res.status(404).json({ error: 'Transaction not found' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

module.exports = router;
