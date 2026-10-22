import React, { useState } from 'react';
import PropTypes from 'prop-types';

export default function ImageCarousel({
  slides,
  label = 'Product image carousel',
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;

  if (slideCount === 0) {
    return null;
  }

  const showPrevious = () => {
    setActiveIndex(
      (currentIndex) => (currentIndex - 1 + slideCount) % slideCount
    );
  };

  const showNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slideCount);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    }
  };

  return (
    <section
      aria-label={label}
      aria-roledescription="carousel"
      className="w-full max-w-full overflow-hidden rounded-3xl bg-white shadow-xl outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="relative w-full max-w-full overflow-hidden"
        data-testid="carousel-viewport"
      >
        <div
          className="flex w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          data-testid="carousel-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <article
              aria-label={`${slide.title}, slide ${index + 1} of ${slideCount}`}
              className="w-full min-w-0 flex-[0_0_100%]"
              key={slide.id ?? slide.src}
            >
              <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] md:items-center md:p-8">
                <div className="overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    alt={slide.alt}
                    className="block aspect-[4/3] h-auto max-h-[28rem] w-full max-w-full object-cover"
                    draggable="false"
                    src={slide.src}
                  />
                </div>
                <div className="min-w-0 space-y-3 text-left">
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                    {slide.eyebrow}
                  </p>
                  <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                    {slide.title}
                  </h2>
                  <p className="text-base leading-7 text-slate-600">
                    {slide.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button
          aria-label="Show previous product image"
          className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-slate-900 shadow ring-1 ring-slate-200 transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
          onClick={showPrevious}
          type="button"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <button
          aria-label="Show next product image"
          className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-slate-900 shadow ring-1 ring-slate-200 transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40"
          onClick={showNext}
          type="button"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 px-4 py-4">
        {slides.map((slide, index) => (
          <button
            aria-current={activeIndex === index ? 'true' : undefined}
            aria-label={`Show slide ${index + 1}: ${slide.title}`}
            className={`h-3 rounded-full transition-all motion-reduce:transition-none ${
              activeIndex === index
                ? 'w-8 bg-blue-600'
                : 'w-3 bg-slate-300 hover:bg-slate-400'
            }`}
            key={slide.id ?? slide.src}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <span className="sr-only">
              {activeIndex === index ? 'Current slide' : 'Go to slide'}{' '}
              {index + 1}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

ImageCarousel.propTypes = {
  label: PropTypes.string,
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      alt: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      eyebrow: PropTypes.string.isRequired,
      id: PropTypes.string,
      src: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })
  ).isRequired,
};
