import request from 'supertest'
import { createApp } from '../src/server.js'

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db'

const app = createApp()

async function signupAndLogin(email, password, name) {
  await request(app).post('/api/auth/signup').send({ email, password, name })
  const res = await request(app).post('/api/auth/login').send({ email, password })
  return res.body.data
}

describe('Users API', () => {
  const email = `me_${Date.now()}@example.com`
  const password = 'password123'

  test('GET /api/me returns current user when authorized', async () => {
    const { token, user } = await signupAndLogin(email, password, 'Me')
    const res = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`).expect(200)
    expect(res.body.data.user.id).toBe(user.id)
  })

  test('PATCH /api/users/:id allows updating own name', async () => {
    const { token, user } = await signupAndLogin(`u_${Date.now()}@ex.com`, password, 'Old')
    const res = await request(app)
      .patch(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' })
      .expect(200)
    expect(res.body.data.user.name).toBe('New Name')
  })

  test('PATCH /api/users/:id rejects updating someone else', async () => {
    const { token } = await signupAndLogin(`a_${Date.now()}@ex.com`, password, 'A')
    // Create another user we will try to update
    const other = await signupAndLogin(`b_${Date.now()}@ex.com`, password, 'B')
    await request(app)
      .patch(`/api/users/${other.user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Hacked' })
      .expect(403)
  })

  test('DELETE /api/users/:id deletes own account', async () => {
    const { token, user } = await signupAndLogin(`d_${Date.now()}@ex.com`, password, 'Del')
    await request(app)
      .delete(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    await request(app)
      .get(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
  })

  test('Requests without Authorization return 401', async () => {
    await request(app).get('/api/me').expect(401)
  })
})
