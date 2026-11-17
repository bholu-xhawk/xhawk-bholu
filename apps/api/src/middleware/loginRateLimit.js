const DEFAULT_ENABLED = true;
const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMITED_BODY = { error: 'Too many login attempts. Please try again later.' };

function parseBoolean(value, name, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be either "true" or "false"`);
}

function parsePositiveInteger(value, name, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function loadLoginRateLimitConfig(env = process.env) {
  return {
    enabled: parseBoolean(env.LOGIN_RATE_LIMIT_ENABLED, 'LOGIN_RATE_LIMIT_ENABLED', DEFAULT_ENABLED),
    maxRequests: parsePositiveInteger(env.LOGIN_RATE_LIMIT_MAX_REQUESTS, 'LOGIN_RATE_LIMIT_MAX_REQUESTS', DEFAULT_MAX_REQUESTS),
    windowMs: parsePositiveInteger(env.LOGIN_RATE_LIMIT_WINDOW_MS, 'LOGIN_RATE_LIMIT_WINDOW_MS', DEFAULT_WINDOW_MS),
  };
}

function secondsUntil(resetAt, now) {
  return Math.max(0, Math.ceil((resetAt - now) / 1000));
}

function setRateLimitHeaders(res, { limit, remaining, resetSeconds }) {
  res.set('RateLimit-Limit', String(limit));
  res.set('RateLimit-Remaining', String(remaining));
  res.set('RateLimit-Reset', String(resetSeconds));
}

function createLoginRateLimiter(options = {}) {
  const enabled = options.enabled ?? DEFAULT_ENABLED;
  const maxRequests = options.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options.now || Date.now;
  const cleanupIntervalMs = options.cleanupIntervalMs ?? windowMs;
  const logger = options.logger || console;

  if (typeof enabled !== 'boolean') throw new Error('enabled must be a boolean');
  if (!Number.isSafeInteger(maxRequests) || maxRequests <= 0) throw new Error('maxRequests must be a positive integer');
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) throw new Error('windowMs must be a positive integer');
  if (!Number.isSafeInteger(cleanupIntervalMs) || cleanupIntervalMs <= 0) throw new Error('cleanupIntervalMs must be a positive integer');

  const windows = new Map();
  let nextCleanupAt = now() + cleanupIntervalMs;

  return function loginRateLimiter(req, res, next) {
    if (!enabled) {
      return next();
    }

    const currentTime = now();
    if (currentTime >= nextCleanupAt) {
      for (const [key, record] of windows.entries()) {
        if (currentTime >= record.resetAt) {
          windows.delete(key);
        }
      }
      nextCleanupAt = currentTime + cleanupIntervalMs;
    }

    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    let record = windows.get(key);

    if (!record || currentTime >= record.resetAt) {
      record = { count: 0, resetAt: currentTime + windowMs };
      windows.set(key, record);
    }

    const resetSeconds = secondsUntil(record.resetAt, currentTime);

    if (record.count >= maxRequests) {
      record.count += 1;
      setRateLimitHeaders(res, { limit: maxRequests, remaining: 0, resetSeconds });
      res.set('Retry-After', String(resetSeconds));
      logger.warn?.('security.login_rate_limited', {
        route: 'POST /api/auth/login',
        retryAfterSeconds: resetSeconds,
      });
      return res.status(429).json(RATE_LIMITED_BODY);
    }

    record.count += 1;
    setRateLimitHeaders(res, {
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - record.count),
      resetSeconds,
    });
    return next();
  };
}

const loginRateLimitConfig = loadLoginRateLimitConfig();
const loginRateLimiter = createLoginRateLimiter(loginRateLimitConfig);

module.exports = {
  createLoginRateLimiter,
  loadLoginRateLimitConfig,
  loginRateLimiter,
  loginRateLimitConfig,
};
