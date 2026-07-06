const express = require('express');

const router = express.Router();

// Build a deterministic in-memory list of 200 issues
const TOTAL_ISSUES = 200;
const issues = Array.from({ length: TOTAL_ISSUES }, (_, i) => {
  const number = i + 1;
  return {
    id: number,
    number,
    title: `Issue number ${number}`,
    state: number % 5 === 0 ? 'closed' : 'open',
    created_at: new Date(2020, 0, 1 + i).toISOString(),
  };
});

router.get('/issues', (req, res) => {
  let { offset, limit } = req.query;

  // normalize and clamp
  offset = Math.max(0, Number(offset) || 0);
  limit = Math.min(100, Math.max(1, Number(limit) || 10));

  const total = issues.length;
  const start = Math.min(offset, total);
  const end = Math.min(start + limit, total);
  const items = issues.slice(start, end);

  res.json({ items, total, offset: start, limit });
});

module.exports = router;
