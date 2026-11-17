const crypto = require('crypto');
const pino = require('pino');
const pinoHttp = require('pino-http');

const REQUEST_LOG_ERROR = Symbol('requestLogError');
const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const DEFAULT_LEVEL = 'info';
const REDACT_PATHS = [
  'authorization',
  'cookie',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  '*.authorization',
  '*.cookie',
  '*.password',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.secret',
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
];

function isValidRequestId(value) {
  return typeof value === 'string' && VALID_REQUEST_ID.test(value);
}

function resolveRequestId(headerValue) {
  const candidate = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return isValidRequestId(candidate) ? candidate : crypto.randomUUID();
}

function normalizePath(path) {
  if (typeof path !== 'string' || path.length === 0) return undefined;
  const [withoutQuery] = path.split('?');
  return withoutQuery || '/';
}

function joinRoute(baseUrl, routePath) {
  if (typeof routePath !== 'string') return undefined;
  const base = baseUrl && baseUrl !== '/' ? baseUrl : '';
  const route = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const combined = `${base}${route}`.replace(/\/+/g, '/');
  return combined === '' ? '/' : combined;
}

function routeTemplate(req, capturedRoute) {
  if (capturedRoute) return capturedRoute;

  const routePath = req.route && typeof req.route.path === 'string' ? req.route.path : undefined;
  const matched = joinRoute(req.baseUrl, routePath);
  if (matched) return matched;

  return normalizePath(req.originalUrl || req.url || req.path);
}

function responseSize(res) {
  const value = res.getHeader && res.getHeader('content-length');
  if (value === undefined) return undefined;
  const size = Number(value);
  return Number.isFinite(size) ? size : undefined;
}

function sanitizeError(err) {
  if (!err) return undefined;
  return {
    name: typeof err.name === 'string' ? err.name : 'Error',
    message: typeof err.message === 'string' ? err.message : String(err),
    stack: typeof err.stack === 'string' ? err.stack : undefined,
  };
}

function attachRequestError(req, err) {
  if (req) {
    req[REQUEST_LOG_ERROR] = sanitizeError(err);
  }
}

function isEnabled(env, enabled) {
  if (typeof enabled === 'boolean') return enabled;

  const configured = env.REQUEST_LOGGING_ENABLED;
  if (configured === 'true') return true;
  if (configured === 'false') return false;

  return env.NODE_ENV !== 'test';
}

function normalizeLevel(level) {
  return Object.prototype.hasOwnProperty.call(pino.levels.values, level) ? level : DEFAULT_LEVEL;
}

function createBaseLogger({ logger, destination, env }) {
  if (logger) return logger;

  return pino(
    {
      level: normalizeLevel(env.LOG_LEVEL || DEFAULT_LEVEL),
      redact: {
        paths: REDACT_PATHS,
        censor: '[Redacted]',
      },
    },
    destination,
  );
}

function completionLevel(statusCode, aborted) {
  if (aborted) return 'warn';
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

function createRequestLogger(options = {}) {
  const env = options.env || process.env;
  if (!isEnabled(env, options.enabled)) {
    return function disabledRequestLogger(req, res, next) {
      next();
    };
  }

  const baseLogger = createBaseLogger({ logger: options.logger, destination: options.destination, env });
  const httpLogger = pinoHttp({
    logger: baseLogger,
    autoLogging: false,
    serializers: {
      req() {
        return undefined;
      },
      res() {
        return undefined;
      },
    },
  });

  return function requestLogger(req, res, next) {
    try {
      httpLogger(req, res, () => {});
    } catch (err) {
      // Logging must never prevent request handling.
    }

    const requestId = resolveRequestId(req.get && req.get('x-request-id'));
    req.id = requestId;
    req.log = typeof baseLogger.child === 'function' ? baseLogger.child({ requestId }) : baseLogger;
    res.setHeader('X-Request-Id', requestId);

    const start = process.hrtime.bigint();
    let emitted = false;
    let capturedRoute;

    const originalWriteHead = res.writeHead;
    res.writeHead = function writeHeadWithRouteCapture(...args) {
      capturedRoute = routeTemplate(req, capturedRoute);
      return originalWriteHead.apply(this, args);
    };

    function emit(aborted) {
      if (emitted) return;
      emitted = true;

      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const record = {
        event: 'request_completed',
        requestId,
        method: req.method,
        route: routeTemplate(req, capturedRoute),
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 1000) / 1000,
        responseSize: responseSize(res),
        aborted,
        err: req[REQUEST_LOG_ERROR],
      };

      try {
        const level = completionLevel(res.statusCode, aborted);
        const log = (req.log && typeof req.log[level] === 'function' ? req.log : baseLogger);
        log[level](record, 'request completed');
      } catch (err) {
        // Fail open if a stream or serializer throws.
      }
    }

    res.once('finish', () => emit(false));
    res.once('close', () => {
      if (!res.writableEnded) emit(true);
    });

    next();
  };
}

module.exports = {
  attachRequestError,
  createRequestLogger,
  isValidRequestId,
};
