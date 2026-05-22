const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_TTL = process.env.ACCESS_TTL || '15m';
const REFRESH_TTL = process.env.REFRESH_TTL || '7d';

async function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id });
}

async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch (e) {
    return false;
  }
}

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, tv: user.tokenVersion }, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, tv: user.tokenVersion, typ: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TTL });
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload.typ && payload.typ !== 'access') {
    // If typ present and not access, treat as invalid
    throw new Error('Invalid token type');
  }
  return payload;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  if (payload.typ !== 'refresh') {
    const err = new Error('Invalid token type');
    err.code = 'INVALID_TOKEN_TYPE';
    throw err;
  }
  return payload;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
