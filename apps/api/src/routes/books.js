const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const bookSelect = {
  id: true,
  title: true,
  author: true,
  description: true,
  publishedYear: true,
  createdAt: true,
  updatedAt: true,
};

const updateBookSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').optional(),
  author: z.string().trim().min(1, 'Author is required').optional(),
  description: z.string().nullable().optional(),
  publishedYear: z.number().int().min(0).nullable().optional(),
});

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/books/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const book = await prisma.book.findUnique({
    where: { id },
    select: bookSelect,
  });

  if (!book) return res.status(404).json({ error: 'Book not found' });
  return res.json(book);
});

router.put('/books/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateBookSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  const data = {};
  const { title, author, description, publishedYear } = parse.data;
  if (title !== undefined) data.title = title;
  if (author !== undefined) data.author = author;
  if (description !== undefined) data.description = description;
  if (publishedYear !== undefined) data.publishedYear = publishedYear;

  if (Object.keys(data).length === 0) {
    return res.status(422).json({ error: 'At least one field is required' });
  }

  try {
    const updated = await prisma.book.update({
      where: { id },
      data,
      select: bookSelect,
    });
    return res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Book not found' });
    return res.status(500).json({ error: 'Failed to update book' });
  }
});

module.exports = router;
