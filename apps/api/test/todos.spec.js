const request = require('supertest');

let app;

describe('TODO API', () => {
  beforeAll(() => {
    app = require('../src/server');
  });

  it('DELETE /api/todos/:id returns the deleted TODO and removes it from mock state', async () => {
    const deleted = await request(app)
      .delete('/api/todos/1')
      .expect(200);

    expect(deleted.body).toEqual({
      message: 'TODO deleted successfully',
      todo: {
        id: 1,
        title: 'Review mock TODO API',
        completed: false,
      },
    });

    const repeated = await request(app)
      .delete('/api/todos/1')
      .expect(404);

    expect(repeated.body).toEqual({ error: 'TODO not found' });
  });

  it.each(['abc', '0', '-1', '1.5'])('DELETE /api/todos/%s rejects invalid identifiers', async (id) => {
    const res = await request(app)
      .delete(`/api/todos/${id}`)
      .expect(400);

    expect(res.body).toEqual({ error: 'Invalid id' });
  });
});
