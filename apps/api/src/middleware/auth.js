const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Expected: Authorization: Bearer <token>' });
  }
  const token = header.slice(prefix.length);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not configured');
    return res.status(500).json({ error: 'JWT_SECRET is not configured' });
  }
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // e.g., { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
