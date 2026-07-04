const express = require('express');
const products = require('../data/products');

const router = express.Router();

function clampInt(value, def, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return def;
  const i = Math.trunc(n);
  if (!Number.isFinite(i)) return def;
  const clamped = Math.min(Math.max(i, min), max);
  return clamped;
}

router.get('/products', (req, res) => {
  const page = clampInt(req.query.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const limit = clampInt(req.query.limit, 10, 1, 50);

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (page > totalPages) {
    return res.json({ items: [], total, page, pageSize: limit, totalPages });
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const items = products.slice(start, end);
  res.json({ items, total, page, pageSize: limit, totalPages });
});

module.exports = router;
