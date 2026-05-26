const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/user');

const DEFAULT_TTL = '1h';

function getSecret() {
  const s = process.env.JWT_SECRET || 'dev-secret';
  return s;
}

function signToken(user, opts = {}) {
  const payload = { sub: String(user.id), email: user.email };
  const token = jwt.sign(payload, getSecret(), {
    algorithm: 'HS256',
    expiresIn: opts.expiresIn || DEFAULT_TTL,
  });
  return token;
}

function verifyJWT(req, res, next) {
  const h = req.headers['authorization'] || '';
  const [scheme, token] = h.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
    const uid = parseInt(decoded.sub, 10);
    const user = getUserById(uid);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { signToken, verifyJWT };
