const express = require('express');
const products = require('../data/products');

const router = express.Router();

// In-memory cart: Map<productId, quantity>
const cart = new Map();

function findProduct(id) {
  return products.find((p) => p.id === id) || null;
}

router.get('/cart', (req, res) => {
  const items = [];
  for (const [productId, quantity] of cart.entries()) {
    const product = findProduct(productId);
    if (product) items.push({ product, quantity });
  }
  res.json(items);
});

router.post('/cart', (req, res) => {
  const { productId, quantity } = req.body || {};
  const id = Number(productId);
  const q = quantity === undefined ? 1 : Number(quantity);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid productId' });
  }
  const product = findProduct(id);
  if (!product) return res.status(400).json({ error: 'Unknown productId' });
  if (!Number.isInteger(q) || q <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }
  const current = cart.get(id) || 0;
  const next = current + q;
  cart.set(id, next);
  return res.status(201).json({ product, quantity: next });
});

router.delete('/cart/:productId', (req, res) => {
  const id = Number(req.params.productId);
  if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Not found' });
  if (!cart.has(id)) return res.status(404).json({ error: 'Not found' });
  cart.delete(id);
  return res.status(204).send();
});

module.exports = router;
