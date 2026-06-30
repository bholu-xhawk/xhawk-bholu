function requireRole(...allowed) {
  const allowedSet = new Set(allowed.map((r) => String(r).toUpperCase()));
  return function (req, res, next) {
    const role = req?.user?.role;
    if (!role || !allowedSet.has(String(role).toUpperCase())) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return next();
  };
}

module.exports = { requireRole };
