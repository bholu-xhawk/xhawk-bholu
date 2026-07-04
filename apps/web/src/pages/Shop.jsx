import React, { useEffect, useState } from 'react';
import { addToCart, getProducts } from '../api';

const PAGE_SIZE = 12;

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Shop() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getProducts(page, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load products');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  const onAdd = async (id) => {
    setMessage('');
    try {
      await addToCart(id, 1);
      setMessage('Added to cart');
      setTimeout(() => setMessage(''), 1500);
    } catch (e) {
      setError(e.message || 'Failed to add to cart');
    }
  };

  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Shop</h1>
      {message && <div className="mb-3 text-green-700">{message}</div>}
      {error && <div className="mb-3 text-red-700">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded shadow flex flex-col">
                <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover rounded" />
                <div className="mt-2 font-medium">{p.name}</div>
                <div className="text-gray-600">{formatPrice(p.price)}</div>
                <button
                  className="mt-auto bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => onAdd(p.id)}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={prev}
              disabled={page <= 1}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages} ({total} items)
            </span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={next}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
