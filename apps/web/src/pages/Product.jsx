import React from 'react';
import ImageCarousel from '../components/ImageCarousel.jsx';

const productSlides = [
  {
    src: '/images/product-1.svg',
    alt: 'Graphite daypack front view with blue zipper pulls',
  },
  {
    src: '/images/product-2.svg',
    alt: 'Open daypack showing padded laptop sleeve and organizer pockets',
  },
  {
    src: '/images/product-3.svg',
    alt: 'Daypack side view with stretch bottle pocket',
  },
];

export default function Product() {
  return (
    <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <ImageCarousel label="Demo product images" slides={productSlides} />

      <section className="min-w-0 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Demo product</p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">Trailhead Everyday Pack</h1>
        <p className="text-lg text-gray-700">
          A representative product detail page for validating responsive image browsing, accessible controls,
          and reduced-motion styling before real catalog data is connected.
        </p>
        <dl className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <dt className="font-semibold text-gray-950">Capacity</dt>
            <dd>24 liters</dd>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <dt className="font-semibold text-gray-950">Materials</dt>
            <dd>Recycled ripstop shell</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
