// Deterministic mock product list (~50 items)
// price is in cents to avoid floating point issues

const products = Array.from({ length: 50 }, (_, idx) => {
  const id = idx + 1;
  const priceCents = 500 + ((id * 137) % 4500); // between 500 and 4999
  return {
    id,
    name: `Product ${id}`,
    price: priceCents,
    imageUrl: `https://picsum.photos/seed/product-${id}/200/200`,
  };
});

module.exports = products;
