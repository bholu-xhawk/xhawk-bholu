const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwt');

function auth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header. Expected: Authorization: Bearer <token>' });
  }
  const token = header.slice(prefix.length);
  let secret;
  try {
    secret = getJwtSecret();
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ error: 'Internal server error' });
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
