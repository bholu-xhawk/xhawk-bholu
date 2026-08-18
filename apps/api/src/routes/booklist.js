const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');

const router = express.Router();

const bookFields = {
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  publishedYear: z.number().int().min(0).max(9999).nullable().optional(),
  genre: z.string().trim().min(1).nullable().optional(),
  isbn: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(1).nullable().optional(),
};

const createBookSchema = z.object(bookFields);
const updateBookSchema = z.object({
  title: bookFields.title.optional(),
  author: bookFields.author.optional(),
  publishedYear: bookFields.publishedYear,
  genre: bookFields.genre,
  isbn: bookFields.isbn,
  description: bookFields.description,
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

router.get('/booklist', async (req, res) => {
  const books = await prisma.book.findMany({ orderBy: { id: 'asc' } });
  res.json(books);
});

router.get('/booklist/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return res.status(404).json({ error: 'Book not found' });

  res.json(book);
});

router.post('/booklist', async (req, res) => {
  const parse = createBookSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const book = await prisma.book.create({ data: parse.data });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

router.put('/booklist/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = updateBookSchema.safeParse(req.body);
  if (!parse.success) return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });

  try {
    const updated = await prisma.book.update({ where: { id }, data: parse.data });
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Book not found' });
    res.status(500).json({ error: 'Failed to update book' });
  }
});

router.delete('/booklist/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  try {
    await prisma.book.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Book not found' });
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

module.exports = router;
