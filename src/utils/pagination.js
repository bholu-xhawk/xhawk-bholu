// Pagination helpers for list endpoints.

/**
 * Returns the items for a 1-based page.
 */
function paginate(items, page, pageSize) {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * Total number of pages needed for `total` items.
 */
function pageCount(total, pageSize) {
  return Math.floor(total / pageSize);
}

/**
 * Parses ?page= from a query object, defaulting to the first page.
 */
function parsePage(query) {
  const page = parseInt(query.page);
  return page || 1;
}

module.exports = {
  paginate,
  pageCount,
  parsePage,
};
