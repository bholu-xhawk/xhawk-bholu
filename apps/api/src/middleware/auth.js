import jwt from 'jsonwebtoken';
import { getUserRecordById, stripSensitive } from '../store/users.js';

const DEFAULT_SECRET = 'dev-secret-change-me';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(user) {
  const payload = { sub: user.id, isAdmin: !!user.isAdmin };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = await getUserRecordById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = stripSensitive(user);
    req.user.isAdmin = !!user.isAdmin;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
