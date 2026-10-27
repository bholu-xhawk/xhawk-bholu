const PUBLIC_API_RATE_LIMIT = Object.freeze({
  limit: 100,
  windowMs: 15 * 60 * 1000,
});

function defaultKeyGenerator(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function toResetSeconds(resetTimeMs) {
  return Math.ceil(resetTimeMs / 1000);
}

function publicApiRateLimit(options = {}) {
  const limit = Number(options.limit ?? PUBLIC_API_RATE_LIMIT.limit);
  const windowMs = Number(options.windowMs ?? PUBLIC_API_RATE_LIMIT.windowMs);
  const now = options.now ?? Date.now;
  const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;
  const store = options.store ?? new Map();

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('Rate limit must be a positive integer');
  }
  if (!Number.isInteger(windowMs) || windowMs <= 0) {
    throw new Error('Rate limit windowMs must be a positive integer');
  }

  return function rateLimit(req, res, next) {
    const currentTime = now();
    const windowStart = currentTime - (currentTime % windowMs);
    const resetTimeMs = windowStart + windowMs;
    const key = keyGenerator(req);
    let record = store.get(key);

    if (!record || record.windowStart !== windowStart) {
      record = { windowStart, count: 0 };
      store.set(key, record);
    }

    if (record.count >= limit) {
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(toResetSeconds(resetTimeMs)));
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: toResetSeconds(resetTimeMs),
      });
    }

    record.count += 1;
    res.set('X-RateLimit-Remaining', String(limit - record.count));
    res.set('X-RateLimit-Reset', String(toResetSeconds(resetTimeMs)));
    return next();
  };
}

module.exports = {
  PUBLIC_API_RATE_LIMIT,
  publicApiRateLimit,
};
