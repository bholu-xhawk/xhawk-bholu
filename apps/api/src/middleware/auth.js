const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Expected: Authorization: Bearer <token>' });
  }
  const token = header.slice(prefix.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = payload; // e.g., { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = auth;
