const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const PAGE_SIZE = 20;
const sortableFields = {
  name: 'name',
  email: 'email',
  company: 'company',
  status: 'status',
  signedUpAt: 'signedUpAt',
};

const querySchema = z.object({
  search: z.string().trim().optional().default(''),
  sortBy: z.enum(Object.keys(sortableFields)).optional().default('name'),
  sortDirection: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
});

function customerFilter(search) {
  if (!search) return {};

  return {
    OR: [
      { name: { contains: search } },
      { email: { contains: search } },
    ],
  };
}

function createCustomersRouter(prismaClient = prisma) {
  const router = express.Router();

  router.get('/customers', async (req, res, next) => {
    const parse = querySchema.safeParse(req.query);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid query', details: parse.error.flatten() });
    }

    const { search, sortBy, sortDirection, page } = parse.data;
    const where = customerFilter(search);
    const orderBy = [
      { [sortableFields[sortBy]]: sortDirection },
      { id: 'asc' },
    ];

    try {
      const [totalItems, customers] = await Promise.all([
        prismaClient.customer.count({ where }),
        prismaClient.customer.findMany({
          where,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            status: true,
            signedUpAt: true,
          },
        }),
      ]);

      res.json({
        customers,
        pagination: {
          page,
          pageSize: PAGE_SIZE,
          totalItems,
          totalPages: Math.ceil(totalItems / PAGE_SIZE),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = createCustomersRouter();
module.exports.createCustomersRouter = createCustomersRouter;
