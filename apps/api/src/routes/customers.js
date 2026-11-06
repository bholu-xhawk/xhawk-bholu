const express = require('express');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const PAGE_SIZE = 20;
const DEFAULT_SORT = 'signedUpAt';
const DEFAULT_DIRECTION = 'desc';
const SORT_FIELDS = new Set(['name', 'email', 'company', 'status', 'signedUpAt']);

function parsePositivePage(value) {
  if (value === undefined) return 1;
  if (Array.isArray(value) || !/^\d+$/.test(String(value))) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : null;
}

function parseCustomerQuery(query) {
  const page = parsePositivePage(query.page);
  if (page === null) return { error: 'Invalid page' };

  const sort = query.sort === undefined ? DEFAULT_SORT : String(query.sort);
  if (!SORT_FIELDS.has(sort)) return { error: 'Invalid sort' };

  const direction = query.direction === undefined ? DEFAULT_DIRECTION : String(query.direction);
  if (!['asc', 'desc'].includes(direction)) return { error: 'Invalid direction' };

  const search = query.search === undefined ? '' : String(query.search).trim();

  return { page, sort, direction, search };
}

function customerSelect() {
  return {
    id: true,
    name: true,
    email: true,
    company: true,
    status: true,
    signedUpAt: true,
  };
}

router.use(auth);

router.get('/customers', async (req, res, next) => {
  const parsed = parseCustomerQuery(req.query);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  const { page, sort, direction, search } = parsed;
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {};

  try {
    const [total, items] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        select: customerSelect(),
        orderBy: [{ [sort]: direction }, { id: direction }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return res.json({
      items,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
module.exports.parseCustomerQuery = parseCustomerQuery;
module.exports.PAGE_SIZE = PAGE_SIZE;
