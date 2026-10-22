import React from 'react';
import ImageCarousel from '../components/ImageCarousel.jsx';

const productSlides = [
  {
    id: 'everyday-pack',
    title: 'Everyday carry pack',
    eyebrow: 'New arrival',
    description:
      'A structured daily bag with padded storage, weather-ready fabric, and room for the tools that move with you.',
    alt: 'Olive green everyday carry backpack with organized front pockets',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Cdefs%3E%3ClinearGradient id="a" x1="0" x2="1" y1="0" y2="1"%3E%3Cstop stop-color="%23dbeafe"/%3E%3Cstop offset="1" stop-color="%231e3a8a"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="600" fill="url(%23a)"/%3E%3Crect x="230" y="120" width="340" height="390" rx="70" fill="%232f4f46"/%3E%3Crect x="285" y="245" width="230" height="160" rx="34" fill="%234f7567"/%3E%3Cpath d="M310 125c20-55 160-55 180 0" fill="none" stroke="%231f2937" stroke-width="28" stroke-linecap="round"/%3E%3Ccircle cx="340" cy="335" r="18" fill="%23bfdbfe"/%3E%3Ccircle cx="460" cy="335" r="18" fill="%23bfdbfe"/%3E%3C/svg%3E',
  },
  {
    id: 'desk-lamp',
    title: 'Focus desk lamp',
    eyebrow: 'Workspace',
    description:
      'A dimmable aluminum lamp with a low-glare diffuser and a compact base for small desks and late nights.',
    alt: 'Matte black adjustable desk lamp casting warm light on a desk',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23fef3c7"/%3E%3Ccircle cx="545" cy="190" r="150" fill="%23fde68a"/%3E%3Cpath d="M200 470h380" stroke="%23292424" stroke-width="36" stroke-linecap="round"/%3E%3Cpath d="M355 455 455 210" stroke="%231f2937" stroke-width="32" stroke-linecap="round"/%3E%3Cpath d="M455 210 575 265" stroke="%231f2937" stroke-width="32" stroke-linecap="round"/%3E%3Cpath d="M545 170c70 0 120 45 120 105H425c0-60 50-105 120-105Z" fill="%23111827"/%3E%3C/svg%3E',
  },
  {
    id: 'ceramic-mug',
    title: 'Insulated ceramic mug',
    eyebrow: 'Best seller',
    description:
      'Double-wall ceramic keeps morning coffee warm while the soft-touch sleeve stays comfortable in hand.',
    alt: 'Cream ceramic mug with blue sleeve and steam rising from the top',
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23ecfeff"/%3E%3Cpath d="M290 210h250l-30 260H320z" fill="%23f8fafc" stroke="%230f172a" stroke-width="18"/%3E%3Cpath d="M333 325h164l-13 105H346z" fill="%232563eb"/%3E%3Cpath d="M540 275h55c48 0 48 92 0 92h-70" fill="none" stroke="%230f172a" stroke-width="24"/%3E%3Cpath d="M350 165c-35-35 35-45 0-85M430 165c-35-35 35-45 0-85" fill="none" stroke="%2394a3b8" stroke-width="18" stroke-linecap="round"/%3E%3C/svg%3E',
  },
];

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 overflow-hidden px-0 py-8 sm:px-4 lg:py-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Product spotlight
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Explore products built for everyday momentum.
        </h1>
        <p className="text-lg leading-8 text-slate-600">
          Browse representative product imagery with controls that work by
          click, keyboard, and direct slide selection.
        </p>
      </div>
      <ImageCarousel slides={productSlides} />
    </section>
  );
}
