const express = require('express');
const { z } = require('zod');
const auth = require('../middleware/auth');

const router = express.Router();

// In-memory mock store
const students = new Map();
let nextId = 1;

const createStudentSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().nonnegative(),
});

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().nonnegative().optional(),
});

router.use(auth);

router.post('/students', (req, res) => {
  const parse = createStudentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const { name, age } = parse.data;
  const id = nextId++;
  const now = new Date().toISOString();
  const student = { id, name, age, createdAt: now, updatedAt: now };
  students.set(id, student);
  return res.status(201).json(student);
});

router.get('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const student = students.get(id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  return res.json(student);
});

router.put('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const parse = updateStudentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(422).json({ error: 'Invalid input', details: parse.error.flatten() });
  }
  const existing = students.get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Student not found' });
  }
  const updated = { ...existing, ...parse.data, updatedAt: new Date().toISOString() };
  students.set(id, updated);
  return res.json(updated);
});

router.delete('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  if (!students.has(id)) {
    return res.status(404).json({ error: 'Student not found' });
  }
  students.delete(id);
  return res.status(204).send();
});

module.exports = router;
