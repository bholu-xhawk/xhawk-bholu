const express = require('express');

const router = express.Router();

const mockItems = [
  {
    id: 1,
    name: 'Mock item 1',
    description: 'A sample mock item',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    name: 'Mock item 2',
    description: 'Another sample mock item',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];
let nextItemId = 3;

function parsePositiveIntegerId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function findItemIndex(id) {
  return mockItems.findIndex((item) => item.id === id);
}

function validateCreatePayload(body) {
  if (!body || typeof body.name !== 'string' || body.name.trim() === '') {
    return { error: 'Invalid input' };
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return { error: 'Invalid input' };
  }

  return {
    data: {
      name: body.name.trim(),
      description: body.description,
    },
  };
}

function validateUpdatePayload(body) {
  if (!body || (body.name === undefined && body.description === undefined)) {
    return { error: 'Invalid input' };
  }
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
    return { error: 'Invalid input' };
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return { error: 'Invalid input' };
  }

  const data = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description;
  return { data };
}

router.get('/items', (req, res) => {
  res.json(mockItems);
});

router.get('/items/:id', (req, res) => {
  const id = parsePositiveIntegerId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const item = mockItems.find((candidate) => candidate.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  res.json(item);
});

router.post('/items', (req, res) => {
  const parse = validateCreatePayload(req.body);
  if (parse.error) return res.status(422).json({ error: parse.error });

  const now = new Date().toISOString();
  const item = {
    id: nextItemId,
    name: parse.data.name,
    description: parse.data.description,
    createdAt: now,
    updatedAt: now,
  };
  nextItemId += 1;
  mockItems.push(item);

  res.status(201).json(item);
});

router.put('/items/:id', (req, res) => {
  const id = parsePositiveIntegerId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const parse = validateUpdatePayload(req.body);
  if (parse.error) return res.status(422).json({ error: parse.error });

  const itemIndex = findItemIndex(id);
  if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });

  const updated = {
    ...mockItems[itemIndex],
    ...parse.data,
    updatedAt: new Date().toISOString(),
  };
  mockItems[itemIndex] = updated;

  res.json(updated);
});

router.delete('/items/:id', (req, res) => {
  const id = parsePositiveIntegerId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const itemIndex = findItemIndex(id);
  if (itemIndex === -1) return res.status(404).json({ error: 'Item not found' });

  mockItems.splice(itemIndex, 1);
  res.status(204).send();
});

module.exports = router;
