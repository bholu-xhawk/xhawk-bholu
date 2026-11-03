import React from 'react';
import ImageCarousel from '../components/ImageCarousel.jsx';

export default function Home() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Photos</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">Home</h1>
        <p className="mt-3 text-gray-600">
          Explore a continuously expanding row of differently sized random images. Use the buttons, mouse wheel,
          keyboard focus, or a touch swipe to move through the carousel.
        </p>
      </header>
      <ImageCarousel />
    </div>
  );
}
