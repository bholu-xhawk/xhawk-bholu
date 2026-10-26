import React from 'react';
import ImageCarousel from '../components/ImageCarousel.jsx';

const sampleProductImages = [
  {
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23dbeafe"/%3E%3Ccircle cx="400" cy="260" r="150" fill="%232563eb"/%3E%3Ctext x="400" y="500" text-anchor="middle" font-family="Arial" font-size="48" fill="%231e3a8a"%3EFront view%3C/text%3E%3C/svg%3E',
    alt: 'Blue backpack front view',
  },
  {
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23dcfce7"/%3E%3Crect x="220" y="140" width="360" height="280" rx="48" fill="%2316a34a"/%3E%3Ctext x="400" y="500" text-anchor="middle" font-family="Arial" font-size="48" fill="%23166534"%3ESide pocket%3C/text%3E%3C/svg%3E',
    alt: 'Blue backpack side pocket detail',
  },
  {
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23fef3c7"/%3E%3Cpath d="M250 420 L400 130 L550 420 Z" fill="%23f59e0b"/%3E%3Ctext x="400" y="500" text-anchor="middle" font-family="Arial" font-size="48" fill="%2392400e"%3EInterior%3C/text%3E%3C/svg%3E',
    alt: 'Blue backpack interior organizer view',
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 overflow-hidden">
      <h1 className="text-3xl font-bold">Home</h1>

      <section
        aria-labelledby="product-images-heading"
        className="w-full min-w-0 overflow-hidden"
      >
        <div className="mb-4 max-w-2xl">
          <h2 className="text-2xl font-semibold" id="product-images-heading">
            Product image preview
          </h2>
          <p className="mt-2 text-gray-600">
            Sample product-image metadata demonstrates the reusable carousel
            until a product page supplies real data.
          </p>
        </div>
        <ImageCarousel images={sampleProductImages} />
      </section>
    </div>
  );
}
