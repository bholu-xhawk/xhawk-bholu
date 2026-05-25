const request = require('supertest');
const { createApp } = require('../src/app');

async function run() {
  const app = createApp();

  // signup succeeds
  let r = await request(app).post('/api/auth/signup').send({ email: 'u1@example.com', password: 'pw1234', name: 'User One' });
  if (r.statusCode !== 201) throw new Error('Signup failed ' + r.statusCode + ' ' + JSON.stringify(r.body));

  // duplicate email returns 422
  r = await request(app).post('/api/auth/signup').send({ email: 'u1@example.com', password: 'pw1234', name: 'User One' });
  if (r.statusCode !== 422) throw new Error('Duplicate email should be 422, got ' + r.statusCode);

  // login succeeds
  r = await request(app).post('/api/auth/login').send({ email: 'u1@example.com', password: 'pw1234' });
  if (r.statusCode !== 200 || !r.body.token) throw new Error('Login failed');
  const token = r.body.token;

  // list users requires auth and returns array
  r = await request(app).get('/api/users');
  if (r.statusCode !== 400) throw new Error('Missing auth should be 400');

  r = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
  if (r.statusCode !== 200 || !Array.isArray(r.body) || r.body.length !== 1) throw new Error('Users list invalid');
  const id = r.body[0].id;

  // get user by id works and wrong id forbidden
  r = await request(app).get(`/api/users/${id}`).set('Authorization', `Bearer ${token}`);
  if (r.statusCode !== 200) throw new Error('Get own user failed');

  r = await request(app).get(`/api/users/${id + 1}`).set('Authorization', `Bearer ${token}`);
  if (r.statusCode !== 422) throw new Error('Accessing other user should be 422');

  // update user name
  r = await request(app).put(`/api/users/${id}`).set('Authorization', `Bearer ${token}`).send({ name: 'User One A' });
  if (r.statusCode !== 200 || r.body.name !== 'User One A') throw new Error('Update failed');

  // delete self
  r = await request(app).delete(`/api/users/${id}`).set('Authorization', `Bearer ${token}`);
  if (r.statusCode !== 204) throw new Error('Delete failed');

  // get deleted -> 404
  r = await request(app).get(`/api/users/${id}`).set('Authorization', `Bearer ${token}`);
  if (r.statusCode !== 404) throw new Error('Deleted user get should be 404');

  console.log('API smoke tests passed');
}

run().catch((e) => { console.error(e); process.exit(1); });