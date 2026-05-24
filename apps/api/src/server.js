import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'

dotenv.config()

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } })
  })

  app.use('/api/auth', authRouter)
  app.use('/api', usersRouter)

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { message: 'Not found' } })
  })

  app.use((err, _req, res, _next) => {
    // Basic error mapping
    const status = err.status || 500
    const message = err.message || 'Internal Server Error'
    res.status(status).json({ success: false, error: { message } })
  })

  return app
}
