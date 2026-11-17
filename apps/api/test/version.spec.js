import request from 'supertest';
import { describe, expect, it } from 'vitest';
import apiPackage from '../package.json';

const mod = await import('../src/server.js');
const app = mod.default || mod;

describe('Version API', () => {
  it('returns the API package version without authentication', async () => {
    const res = await request(app)
      .get('/api/version')
      .expect(200);

    expect(res.body).toEqual({ version: apiPackage.version });
  });
});
