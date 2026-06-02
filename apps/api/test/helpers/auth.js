import request from 'supertest';

// Helper to get Authorization header for protected routes
// It will try to sign up a fresh user and then login to obtain a JWT token
export async function getAuthHeader(app, { email, password } = {}) {
  const userEmail = email || `tester+${Date.now()}@example.com`;
  const userPassword = password || 'password123';

  // Try signup (ignore duplicate error), then login
  await request(app)
    .post('/api/auth/signup')
    .send({ email: userEmail, password: userPassword, name: 'Tester' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: userEmail, password: userPassword });

  if (!res.body || !res.body.token) {
    throw new Error('Failed to obtain auth token in tests');
  }

  return { Authorization: `Bearer ${res.body.token}` };
}
