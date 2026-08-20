const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const DEFAULT_SORT_BY = 'title';
const DEFAULT_SORT_DIRECTION = 'asc';
const ALLOWED_SORT_FIELDS = new Set(['title', 'author', 'publicationDate']);
const ALLOWED_SORT_DIRECTIONS = new Set(['asc', 'desc']);

function parsePositiveInteger(value, name, defaultValue) {
  if (value === undefined) return { value: defaultValue };
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: `${name} must be a positive integer` };
  }
  return { value: parsed };
}

function parseBooklistQuery(query) {
  const page = parsePositiveInteger(query.page, 'page', DEFAULT_PAGE);
  if (page.error) return { error: page.error };

  const requestedPageSize = parsePositiveInteger(query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE);
  if (requestedPageSize.error) return { error: requestedPageSize.error };

  const sortBy = query.sortBy || DEFAULT_SORT_BY;
  if (!ALLOWED_SORT_FIELDS.has(sortBy)) {
    return { error: 'sortBy must be one of title, author, publicationDate' };
  }

  const sortDirection = query.sortDirection || DEFAULT_SORT_DIRECTION;
  if (!ALLOWED_SORT_DIRECTIONS.has(sortDirection)) {
    return { error: 'sortDirection must be asc or desc' };
  }

  return {
    page: page.value,
    pageSize: Math.min(requestedPageSize.value, MAX_PAGE_SIZE),
    sortBy,
    sortDirection,
  };
}

router.get('/booklist', async (req, res) => {
  const parsed = parseBooklistQuery(req.query);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const { page, pageSize, sortBy, sortDirection } = parsed;

  try {
    const [items, totalItems] = await prisma.$transaction([
      prisma.book.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortDirection },
        select: {
          id: true,
          title: true,
          author: true,
          publicationDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.book.count(),
    ]);

    return res.json({
      items,
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      sortBy,
      sortDirection,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load booklist' });
  }
});

module.exports = router;
