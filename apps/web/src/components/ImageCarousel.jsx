import React, { useState } from 'react';
import PropTypes from 'prop-types';

function normalizeIndex(index, length) {
  return ((index % length) + length) % length;
}

export default function ImageCarousel({ slides = [], label = 'Product image carousel' }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (slides.length === 0) {
    return null;
  }

  const hasMultipleSlides = slides.length > 1;
  const activeSlide = slides[activeIndex];

  function goToSlide(index) {
    setActiveIndex(normalizeIndex(index, slides.length));
  }

  function goToPrevious() {
    goToSlide(activeIndex - 1);
  }

  function goToNext() {
    goToSlide(activeIndex + 1);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  }

  return (
    <section
      aria-label={label}
      className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm"
      onKeyDown={hasMultipleSlides ? handleKeyDown : undefined}
      tabIndex={hasMultipleSlides ? 0 : undefined}
    >
      <div className="relative w-full max-w-full min-w-0 overflow-hidden bg-gray-100">
        <div
          className="flex w-full max-w-full min-w-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none motion-reduce:duration-0"
          data-testid="carousel-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              aria-hidden={index !== activeIndex}
              className="w-full max-w-full min-w-0 shrink-0"
              key={slide.src}
            >
              <img
                alt={slide.alt}
                className="aspect-[4/3] w-full max-w-full object-cover"
                src={slide.src}
              />
            </div>
          ))}
        </div>

        {hasMultipleSlides ? (
          <>
            <button
              aria-label="Show previous product image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              onClick={goToPrevious}
              type="button"
            >
              Previous
            </button>
            <button
              aria-label="Show next product image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              onClick={goToNext}
              type="button"
            >
              Next
            </button>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-4 p-4">
        <p aria-live="polite" className="text-sm font-medium text-gray-700">
          Image {activeIndex + 1} of {slides.length}: {activeSlide.alt}
        </p>

        {hasMultipleSlides ? (
          <div aria-label="Choose product image" className="flex gap-2" role="group">
            {slides.map((slide, index) => (
              <button
                aria-current={index === activeIndex ? 'true' : undefined}
                aria-label={`Show product image ${index + 1}: ${slide.alt}`}
                className={`h-3 w-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  index === activeIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                key={slide.src}
                onClick={() => goToSlide(index)}
                type="button"
              >
                <span className="sr-only">{slide.alt}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

ImageCarousel.propTypes = {
  label: PropTypes.string,
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      alt: PropTypes.string.isRequired,
      src: PropTypes.string.isRequired,
    })
  ),
};
