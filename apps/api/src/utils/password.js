const crypto = require('crypto');
const { promisify } = require('util');

const pbkdf2 = promisify(crypto.pbkdf2);

const ITERATIONS = 310000;
const KEYLEN = 32;
const DIGEST = 'sha256';

async function hash(password /*, rounds */) {
  const salt = crypto.randomBytes(16);
  const derived = await pbkdf2(Buffer.from(password, 'utf8'), salt, ITERATIONS, KEYLEN, DIGEST);
  return `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${derived.toString('base64')}`;
}

async function compare(password, stored) {
  try {
    if (typeof stored !== 'string') return false;
    const parts = stored.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
    const iterations = parseInt(parts[1], 10);
    const salt = Buffer.from(parts[2], 'base64');
    const hash = Buffer.from(parts[3], 'base64');
    const derived = await pbkdf2(Buffer.from(password, 'utf8'), salt, iterations, hash.length, DIGEST);
    if (derived.length !== hash.length) return false;
    return crypto.timingSafeEqual(derived, hash);
  } catch {
    return false;
  }
}

module.exports = { hash, compare };
