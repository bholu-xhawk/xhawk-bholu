const express = require('express');
const { z } = require('zod');

const router = express.Router();

const DEFAULT_COUNT = 8;
const MIN_COUNT = 1;
const MAX_COUNT = 12;
const MAX_PICSUM_PAGE = 100;

const querySchema = z.object({
  count: z
    .preprocess((value) => (value === undefined ? DEFAULT_COUNT : Number(value)), z.number().int())
    .refine((value) => value >= MIN_COUNT, `count must be at least ${MIN_COUNT}`)
    .transform((value) => Math.min(value, MAX_COUNT)),
});

function normalizeImage(record) {
  const id = String(record.id ?? '').trim();
  const width = Number(record.width);
  const height = Number(record.height);
  const author = String(record.author ?? '').trim();

  if (!id || !Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  const safeAuthor = author || 'Unknown photographer';

  return {
    id,
    src: `https://picsum.photos/id/${encodeURIComponent(id)}/${Math.round(width)}/${Math.round(height)}`,
    width: Math.round(width),
    height: Math.round(height),
    author: safeAuthor,
    alt: `Random photo by ${safeAuthor}`,
  };
}

function providerFailure(res) {
  return res.status(502).json({ error: 'Image provider unavailable' });
}

router.get('/images', async (req, res) => {
  const parse = querySchema.safeParse(req.query);

  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid image request', details: parse.error.flatten() });
  }

  const { count } = parse.data;
  const page = Math.floor(Math.random() * MAX_PICSUM_PAGE) + 1;
  const url = new URL('https://picsum.photos/v2/list');
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(count));

  try {
    const upstream = await fetch(url);

    if (!upstream.ok) {
      return providerFailure(res);
    }

    const payload = await upstream.json();
    if (!Array.isArray(payload)) {
      return providerFailure(res);
    }

    const images = payload.map(normalizeImage).filter(Boolean);
    if (images.length === 0) {
      return providerFailure(res);
    }

    return res.json({ images });
  } catch (error) {
    return providerFailure(res);
  }
});

module.exports = router;
module.exports.normalizeImage = normalizeImage;
module.exports.DEFAULT_COUNT = DEFAULT_COUNT;
module.exports.MAX_COUNT = MAX_COUNT;
