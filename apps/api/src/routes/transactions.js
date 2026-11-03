const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const transactionFields = {
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable().optional(),
  date: z.string().datetime(),
};

const createTransactionSchema = z.object(transactionFields).strict();

const updateTransactionSchema = z
  .object({
    amount: transactionFields.amount.optional(),
    type: transactionFields.type.optional(),
    category: transactionFields.category.optional(),
    description: transactionFields.description,
    date: transactionFields.date.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function toTransactionResponse(transaction) {
  return {
    id: transaction.id,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    description: transaction.description,
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

function toTransactionData(input) {
  const data = {};
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.type !== undefined) data.type = input.type;
  if (input.category !== undefined) data.category = input.category;
  if (input.description !== undefined) data.description = input.description;
  if (input.date !== undefined) data.date = new Date(input.date);
  return data;
}

router.use(auth);

router.get('/transactions', async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
  });

  res.json(transactions.map(toTransactionResponse));
});

router.get('/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
  res.json(toTransactionResponse(transaction));
});

router.post('/transactions', async (req, res) => {
  const parse = createTransactionSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...toTransactionData(parse.data),
      userId: req.user.id,
    },
  });

  res.status(201).json(toTransactionResponse(transaction));
});

router.put('/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateTransactionSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }

  const result = await prisma.transaction.updateMany({
    where: { id, userId: req.user.id },
    data: toTransactionData(parse.data),
  });

  if (result.count === 0) return res.status(404).json({ error: 'Transaction not found' });

  const updated = await prisma.transaction.findFirst({
    where: { id, userId: req.user.id },
  });

  res.json(toTransactionResponse(updated));
});

router.delete('/transactions/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const result = await prisma.transaction.deleteMany({
    where: { id, userId: req.user.id },
  });

  if (result.count === 0) return res.status(404).json({ error: 'Transaction not found' });
  res.status(204).send();
});

module.exports = router;
