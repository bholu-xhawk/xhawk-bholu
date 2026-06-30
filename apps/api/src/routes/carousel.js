const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Public GET: list active images ordered by position ASC, id ASC
router.get('/carousel-images', async (req, res) => {
  try {
    const images = await prisma.carouselImage.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// Authenticated routes below
router.use(auth);

const createSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.post('/carousel-images', async (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const { url, alt, title, caption, position, isActive } = parse.data;

  try {
    if (position === undefined) {
      const result = await prisma.$transaction(async (tx) => {
        const created = await tx.carouselImage.create({
          data: {
            url,
            alt: alt ?? undefined,
            title: title ?? undefined,
            caption: caption ?? undefined,
            position: 0,
            isActive: isActive ?? true,
          },
        });
        const updated = await tx.carouselImage.update({
          where: { id: created.id },
          data: { position: created.id },
        });
        return updated;
      });
      return res.status(201).json(result);
    }

    const created = await prisma.carouselImage.create({
      data: {
        url,
        alt: alt ?? undefined,
        title: title ?? undefined,
        caption: caption ?? undefined,
        position,
        isActive: isActive ?? true,
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create image' });
  }
});

const updateSchema = z.object({
  url: z.string().url().optional(),
  alt: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

router.put('/carousel-images/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const { url, alt, title, caption, position, isActive } = parse.data;

  const data = {};
  if (url !== undefined) data.url = url;
  if (alt !== undefined) data.alt = alt;
  if (title !== undefined) data.title = title;
  if (caption !== undefined) data.caption = caption;
  if (position !== undefined) data.position = position;
  if (isActive !== undefined) data.isActive = isActive;

  try {
    const updated = await prisma.carouselImage.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Image not found' });
    res.status(500).json({ error: 'Failed to update image' });
  }
});

router.delete('/carousel-images/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });
  try {
    await prisma.carouselImage.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Image not found' });
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.number().int(), position: z.number().int() })).nonempty(),
});

router.put('/carousel-images/reorder', async (req, res) => {
  const parse = reorderSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  const { items } = parse.data;
  const positions = items.map(i => i.position);
  if (new Set(positions).size !== positions.length || positions.some(p => p < 0)) {
    return res.status(422).json({ error: 'Positions must be unique and non-negative' });
  }
  try {
    await prisma.$transaction(
      items.map(({ id, position }) =>
        prisma.carouselImage.update({ where: { id }, data: { position } })
      )
    );
    const images = await prisma.carouselImage.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }] });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder images' });
  }
});

module.exports = router;
