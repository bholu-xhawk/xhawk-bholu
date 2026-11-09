const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const PAGE_SIZE = 20;
const SORT_FIELDS = new Set(['name', 'email', 'company', 'status', 'createdAt']);
const SORT_DIRECTIONS = new Set(['asc', 'desc']);

const querySchema = z.object({
  search: z.string().trim().optional().default(''),
  page: z
    .string()
    .optional()
    .default('1')
    .refine((value) => /^\d+$/.test(value), 'Page must be a positive integer')
    .transform(Number)
    .refine((value) => value > 0, 'Page must be a positive integer'),
  sortBy: z
    .string()
    .optional()
    .default('createdAt')
    .refine((value) => SORT_FIELDS.has(value), 'Invalid sort field'),
  sortDirection: z
    .string()
    .optional()
    .default('desc')
    .refine((value) => SORT_DIRECTIONS.has(value), 'Invalid sort direction'),
});

function buildCustomerWhere(search) {
  if (!search) return {};

  return {
    OR: [
      { name: { contains: search } },
      { email: { contains: search } },
    ],
  };
}

router.use(auth);

router.get('/customers', async (req, res, next) => {
  const parse = querySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid query', details: parse.error.flatten() });
  }

  const { search, page, sortBy, sortDirection } = parse.data;
  const where = buildCustomerWhere(search);

  try {
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ [sortBy]: sortDirection }, { id: 'asc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
