const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

function requireAuth(req, res, next) {
  const hdr = req.header('Authorization') || '';
  const [scheme, token] = hdr.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(400).json({ error: 'Missing or invalid Authorization header' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: parseInt(payload.sub, 10) };
    return next();
  } catch (err) {
    return res.status(400).json({ error: 'Invalid token' });
  }
}

module.exports = { signToken, requireAuth };
