const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.DB_FILE = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const app = require('../src/app');

let token;
let userId;

// signup success
test('POST /api/signup creates a user', async () => {
  const res = await request(app)
    .post('/api/signup')
    .send({ email: 'a@example.com', password: 'secret12', name: 'Alice' })
    .expect(201);
  assert.equal(typeof res.body.id, 'number');
  assert.equal(res.body.email, 'a@example.com');
  assert.equal(res.body.name, 'Alice');
  userId = res.body.id;
});

// signup validation
test('POST /api/signup validation 422', async () => {
  await request(app).post('/api/signup').send({}).expect(422);
  await request(app)
    .post('/api/signup')
    .send({ email: 'bad', password: 'short', name: '' })
    .expect(422);
});

// signup duplicate
test('POST /api/signup duplicate email 422', async () => {
  await request(app)
    .post('/api/signup')
    .send({ email: 'a@example.com', password: 'anothersecret', name: 'Alice 2' })
    .expect(422);
});

// login success
test('POST /api/login returns token', async () => {
  const res = await request(app)
    .post('/api/login')
    .send({ email: 'a@example.com', password: 'secret12' })
    .expect(200);
  assert.ok(res.body.token);
  token = res.body.token;
});

// login invalid
test('POST /api/login invalid credentials 400', async () => {
  await request(app)
    .post('/api/login')
    .send({ email: 'a@example.com', password: 'wrong' })
    .expect(400);
});

// list users
test('GET /api/users requires token and returns users', async () => {
  await request(app).get('/api/users').expect(400); // missing token
  const res = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body[0].email, 'a@example.com');
  assert.equal(res.body[0].password_hash, undefined);
});

// get by id
test('GET /api/users/:id returns user or 404', async () => {
  await request(app)
    .get(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  await request(app)
    .get('/api/users/9999')
    .set('Authorization', `Bearer ${token}`)
    .expect(404);
});

// update self
test('PUT /api/users/:id updates self and validates', async () => {
  await request(app)
    .put(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: '' })
    .expect(422);
  const res = await request(app)
    .put(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Alice Updated', password: 'newsecret' })
    .expect(200);
  assert.equal(res.body.name, 'Alice Updated');
});

// delete self
test('DELETE /api/users/:id deletes self and then 404', async () => {
  await request(app)
    .delete(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(204);
  await request(app)
    .get(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404);
});
