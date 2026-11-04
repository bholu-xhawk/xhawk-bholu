const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();
const PAGE_SIZE = 20;
const SORT_FIELDS = ['name', 'email', 'company', 'status', 'createdAt'];

const querySchema = z.object({
  search: z.string().optional().default('').transform((value) => value.trim()),
  sortBy: z.enum(SORT_FIELDS).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
});

const customerSelect = {
  id: true,
  name: true,
  email: true,
  company: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

router.use(auth);

router.get('/customers', async (req, res, next) => {
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid query', details: parse.error.flatten() });
  }

  const { search, sortBy, sortOrder, page } = parse.data;
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : undefined;

  try {
    const totalItems = await prisma.customer.count({ where });
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const lastAvailablePage = Math.max(totalPages, 1);
    const clampedPage = Math.min(page, lastAvailablePage);

    const data = await prisma.customer.findMany({
      where,
      select: customerSelect,
      orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }],
      skip: (clampedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return res.json({
      data,
      pagination: {
        page: clampedPage,
        pageSize: PAGE_SIZE,
        totalItems,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
