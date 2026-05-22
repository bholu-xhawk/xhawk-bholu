const { verifyAccessToken } = require('../auth');

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') {
    return res.status(400).json({ error: 'Malformed Authorization header' });
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, tokenVersion: payload.tv };
    next();
  } catch (e) {
    return res.status(422).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
