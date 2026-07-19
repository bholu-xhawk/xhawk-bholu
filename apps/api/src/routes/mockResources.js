const express = require('express');
const { z } = require('zod');

const router = express.Router();

const now = '2024-01-01T00:00:00.000Z';

const mockResources = [
  {
    id: 1,
    name: 'Example resource',
    description: 'A deterministic mock resource for API clients.',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    name: 'Archived example resource',
    description: 'A second mock resource showing another status.',
    status: 'archived',
    createdAt: now,
    updatedAt: now,
  },
];

const resourceStatusSchema = z.enum(['active', 'inactive', 'archived']);

const createResourceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional(),
  status: resourceStatusSchema.optional(),
});

const updateResourceSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  description: z.string().trim().optional(),
  status: resourceStatusSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
});

function success(res, status, data, message, meta) {
  const body = { success: true, data, message };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function failure(res, status, message, details) {
  const body = { success: false, error: { message } };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

function parseResourceId(id) {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function findResource(id) {
  return mockResources.find((resource) => resource.id === id);
}

router.get('/resources', (req, res) => {
  return success(res, 200, mockResources, 'Resources retrieved', { count: mockResources.length });
});

router.get('/resources/:id', (req, res) => {
  const id = parseResourceId(req.params.id);
  if (!id) return failure(res, 400, 'Invalid resource id');

  const resource = findResource(id);
  if (!resource) return failure(res, 404, 'Resource not found');

  return success(res, 200, resource, 'Resource retrieved');
});

router.post('/resources', (req, res) => {
  const parse = createResourceSchema.safeParse(req.body);
  if (!parse.success) return failure(res, 422, 'Invalid input', parse.error.flatten());

  const resource = {
    id: 3,
    name: parse.data.name,
    description: parse.data.description || 'Created mock resource description',
    status: parse.data.status || 'active',
    createdAt: now,
    updatedAt: now,
  };

  return success(res, 201, resource, 'Resource created');
});

router.put('/resources/:id', (req, res) => {
  const id = parseResourceId(req.params.id);
  if (!id) return failure(res, 400, 'Invalid resource id');

  const parse = updateResourceSchema.safeParse(req.body);
  if (!parse.success) return failure(res, 422, 'Invalid input', parse.error.flatten());

  const existing = findResource(id);
  if (!existing) return failure(res, 404, 'Resource not found');

  const resource = {
    ...existing,
    ...parse.data,
    updatedAt: now,
  };

  return success(res, 200, resource, 'Resource updated');
});

router.delete('/resources/:id', (req, res) => {
  const id = parseResourceId(req.params.id);
  if (!id) return failure(res, 400, 'Invalid resource id');

  const resource = findResource(id);
  if (!resource) return failure(res, 404, 'Resource not found');

  return success(res, 200, { id, deleted: true }, 'Resource deleted');
});

module.exports = router;
