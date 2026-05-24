import express from 'express'
import { z } from 'zod'
import { getPrisma } from '../db.js'
import { requireAuth, hashPassword } from '../middleware/auth.js'

export const usersRouter = express.Router()

function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

const updateSchema = z.object({
  name: z.string().optional(),
  password: z.string().min(8).optional()
})

usersRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!user) return res.status(404).json({ success: false, error: { message: 'Not found' } })
    return res.json({ success: true, data: { user: sanitizeUser(user) } })
  } catch (err) { next(err) }
})

usersRouter.get('/users/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (req.user.id !== id) return res.status(403).json({ success: false, error: { message: 'Forbidden' } })
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ success: false, error: { message: 'Not found' } })
    return res.json({ success: true, data: { user: sanitizeUser(user) } })
  } catch (err) { next(err) }
})

usersRouter.patch('/users/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (req.user.id !== id) return res.status(403).json({ success: false, error: { message: 'Forbidden' } })
    const parsed = updateSchema.parse(req.body)
    const data = {}
    if (parsed.name !== undefined) data.name = parsed.name
    if (parsed.password) data.passwordHash = await hashPassword(parsed.password)
    const prisma = getPrisma()
    const user = await prisma.user.update({ where: { id }, data })
    return res.json({ success: true, data: { user: sanitizeUser(user) } })
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(422).json({ success: false, error: { message: 'Validation failed', details: err.errors } })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: { message: 'Not found' } })
    }
    next(err)
  }
})

usersRouter.delete('/users/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (req.user.id !== id) return res.status(403).json({ success: false, error: { message: 'Forbidden' } })
    const prisma = getPrisma()
    await prisma.user.delete({ where: { id } })
    return res.json({ success: true, data: { id } })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, error: { message: 'Not found' } })
    }
    next(err)
  }
})
