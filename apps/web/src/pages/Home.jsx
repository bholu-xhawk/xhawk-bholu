import React from 'react';
import ImageCarousel from '../components/ImageCarousel.jsx';

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="max-w-3xl space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Photo browsing</p>
        <h1 className="text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
          Browse a living photo album
        </h1>
        <p className="text-lg text-gray-600">
          Discover a horizontal stream of varied image cards. Use the buttons, keyboard focus,
          touch, trackpad, or native scrolling to keep exploring.
        </p>
      </section>

      <ImageCarousel />
    </div>
  );
}
