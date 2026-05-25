const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function hashPassword(password) {
  // Use sync to avoid callback complexity but keep async signature
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  return hash;
}

async function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: opts.expiresIn || '1h' });
}

function authMiddleware(req, res, next) {
  try {
    const auth = req.headers['authorization'] || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next({ status: 400, code: 'bad_request', message: 'Missing or malformed Authorization header' });
    }
    const token = parts[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (e) {
      return next({ status: 422, code: 'invalid_token', message: 'Invalid or expired token' });
    }
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { hashPassword, verifyPassword, signToken, authMiddleware };