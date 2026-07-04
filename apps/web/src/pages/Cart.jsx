import React, { useEffect, useMemo, useState } from 'react';
import { getCart, removeFromCart } from '../api';

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCart = () => {
    setLoading(true);
    setError('');
    getCart()
      .then((data) => setItems(data))
      .catch((err) => setError(err.message || 'Failed to load cart'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [items]);

  const onRemove = async (id) => {
    try {
      await removeFromCart(id);
      fetchCart();
    } catch (e) {
      setError(e.message || 'Failed to remove item');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Cart</h1>
      {error && <div className="mb-3 text-red-700">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>Your cart is empty.</div>
      ) : (
        <>
          <ul className="divide-y bg-white rounded shadow">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="p-4 flex items-center gap-4">
                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-gray-600">
                    {formatPrice(product.price)} x {quantity} = {formatPrice(product.price * quantity)}
                  </div>
                </div>
                <button
                  className="px-3 py-1 border rounded text-red-700 hover:bg-red-50"
                  onClick={() => onRemove(product.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-right font-semibold">Total: {formatPrice(total)}</div>
        </>
      )}
    </div>
  );
}
