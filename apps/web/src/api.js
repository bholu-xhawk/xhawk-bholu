export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

async function handle(res) {
  if (!res.ok) {
    let msg = res.statusText || 'Request failed';
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch (_) {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  // 204 - no content
  if (res.status === 204) return null;
  return res.json();
}

export async function getProducts(page = 1, limit = 10) {
  const res = await fetch(`${API_BASE}/products?page=${page}&limit=${limit}`);
  return handle(res);
}

export async function addToCart(productId, quantity = 1) {
  const res = await fetch(`${API_BASE}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  });
  return handle(res);
}

export async function getCart() {
  const res = await fetch(`${API_BASE}/cart`);
  return handle(res);
}

export async function removeFromCart(productId) {
  const res = await fetch(`${API_BASE}/cart/${productId}`, { method: 'DELETE' });
  if (res.status === 204) return null;
  return handle(res);
}
