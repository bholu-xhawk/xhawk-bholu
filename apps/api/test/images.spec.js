import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let app;

const providerImages = [
  { id: '10', author: 'Ada', width: 1200, height: 800 },
  { id: '11', author: 'Grace', width: 900, height: 1200 },
];

function mockProviderResponse(body, ok = true) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(body),
  });
}

describe('Images API', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const mod = await import('../src/server.js');
    app = mod.default || mod;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.fetch;
  });

  it('returns normalized images from Picsum', async () => {
    mockProviderResponse(providerImages);

    const res = await request(app).get('/api/images?count=2').expect(200);

    expect(res.body).toEqual({
      images: [
        {
          id: '10',
          src: 'https://picsum.photos/id/10/1200/800',
          width: 1200,
          height: 800,
          author: 'Ada',
          alt: 'Random photo by Ada',
        },
        {
          id: '11',
          src: 'https://picsum.photos/id/11/900/1200',
          width: 900,
          height: 1200,
          author: 'Grace',
          alt: 'Random photo by Grace',
        },
      ],
    });
    const url = globalThis.fetch.mock.calls[0][0];
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('limit')).toBe('2');
  });

  it('uses the default count and caps oversized requests', async () => {
    mockProviderResponse(providerImages);

    await request(app).get('/api/images?count=99').expect(200);

    expect(globalThis.fetch.mock.calls[0][0].searchParams.get('limit')).toBe('12');
  });

  it('rejects invalid counts before calling the provider', async () => {
    globalThis.fetch = vi.fn();

    const res = await request(app).get('/api/images?count=0').expect(400);

    expect(res.body.error).toBe('Invalid image request');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('translates rejected provider calls into a controlled 502', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    const res = await request(app).get('/api/images').expect(502);

    expect(res.body).toEqual({ error: 'Image provider unavailable' });
  });

  it('translates non-OK provider responses into a controlled 502', async () => {
    mockProviderResponse([], false);

    const res = await request(app).get('/api/images').expect(502);

    expect(res.body).toEqual({ error: 'Image provider unavailable' });
  });

  it('translates malformed provider payloads into a controlled 502', async () => {
    mockProviderResponse([{ id: 'bad', author: 'No Size' }]);

    const res = await request(app).get('/api/images').expect(502);

    expect(res.body).toEqual({ error: 'Image provider unavailable' });
  });
});
