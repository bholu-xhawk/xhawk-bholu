import request from 'supertest'
import { createApp } from '../src/server.js'

// Ensure env for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db'

const app = createApp()

describe('Auth API', () => {
  const email = `user_${Date.now()}@example.com`
  const password = 'password123'

  test('POST /api/auth/signup returns 200 with token and user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email, password, name: 'Test User' })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.user.email).toBe(email)
    expect(res.body.data.user).not.toHaveProperty('passwordHash')
  })

  test('POST /api/auth/signup with duplicate email returns 422', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email, password })
      .expect(422)

    expect(res.body.success).toBe(false)
  })

  test('POST /api/auth/login with correct password returns 200 and token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTruthy()
  })

  test('POST /api/auth/login with wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' })
      .expect(401)

    expect(res.body.success).toBe(false)
  })
})
