import jwt from 'jsonwebtoken'
import argon2 from 'argon2'

export function issueToken(payload) {
  const secret = process.env.JWT_SECRET || ''
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  if (!secret) throw Object.assign(new Error('JWT secret not configured'), { status: 500 })
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || ''
  if (!secret) throw Object.assign(new Error('JWT secret not configured'), { status: 500 })
  return jwt.verify(token, secret)
}

export async function hashPassword(plain) {
  return argon2.hash(plain, { type: argon2.argon2id })
}

export async function verifyPassword(hash, plain) {
  return argon2.verify(hash, plain)
}

export function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || ''
  const parts = header.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } })
  }
  try {
    const decoded = verifyToken(parts[1])
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } })
  }
}
