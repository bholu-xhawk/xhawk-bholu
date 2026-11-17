require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const { loginRateLimitConfig } = require('./middleware/loginRateLimit');

function parseTrustProxyHops(env = process.env) {
  const raw = env.TRUST_PROXY_HOPS;
  if (raw === undefined || raw === '') return undefined;
  if (!/^\d+$/.test(raw)) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }
  return parsed;
}

const trustProxyHops = parseTrustProxyHops();
const app = express();

if (trustProxyHops !== undefined) {
  app.set('trust proxy', trustProxyHops);
}

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api', userRoutes);

// 404 handler for /api
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

function describeTrustProxyMode() {
  return trustProxyHops === undefined ? 'disabled' : `${trustProxyHops} trusted hop${trustProxyHops === 1 ? '' : 's'}`;
}

function reportStartupMode() {
  console.log('API startup mode', {
    trustProxy: describeTrustProxyMode(),
    loginRateLimitEnabled: loginRateLimitConfig.enabled,
    loginRateLimitMaxRequests: loginRateLimitConfig.maxRequests,
    loginRateLimitWindowMs: loginRateLimitConfig.windowMs,
  });
}

const port = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    reportStartupMode();
  });
}

module.exports = app; // export for testing
module.exports.parseTrustProxyHops = parseTrustProxyHops;
module.exports.reportStartupMode = reportStartupMode;
