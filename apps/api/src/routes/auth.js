import express from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import { hashPassword, verifyPassword, issueToken } from '../middleware/auth.js'

export const authRouter = express.Router()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

authRouter.post('/signup', async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body)
    const prisma = getPrisma()
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existing) {
      return res.status(422).json({ success: false, error: { message: 'Email already in use' } })
    }
    const passwordHash = await hashPassword(parsed.password)
    const user = await prisma.user.create({ data: { email: parsed.email, passwordHash, name: parsed.name || null } })
    const token = issueToken({ id: user.id, email: user.email })
    return res.json({ success: true, data: { user: sanitizeUser(user), token } })
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(422).json({ success: false, error: { message: 'Validation failed', details: err.errors } })
    }
    next(err)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.parse(req.body)
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (!user) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } })
    }
    const ok = await verifyPassword(user.passwordHash, parsed.password)
    if (!ok) {
      return res.status(401).json({ success: false, error: { message: 'Invalid email or password' } })
    }
    const token = issueToken({ id: user.id, email: user.email })
    return res.json({ success: true, data: { user: sanitizeUser(user), token } })
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(422).json({ success: false, error: { message: 'Validation failed', details: err.errors } })
    }
    next(err)
  }
})
