import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function getWrappedIndex(index, length) {
  return ((index % length) + length) % length;
}

export default function ImageCarousel({
  images = [],
  label = 'Product images',
}) {
  const slides = useMemo(() => images.filter((image) => image?.src), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;
  const hasMultipleSlides = slideCount > 1;
  const activeSlide = slides[activeIndex] ?? null;

  useEffect(() => {
    if (slideCount === 0 && activeIndex !== 0) {
      setActiveIndex(0);
      return;
    }

    if (slideCount > 0 && activeIndex >= slideCount) {
      setActiveIndex(slideCount - 1);
    }
  }, [activeIndex, slideCount]);

  function showSlide(index) {
    if (slideCount === 0) {
      return;
    }

    setActiveIndex(getWrappedIndex(index, slideCount));
  }

  function showPrevious() {
    showSlide(activeIndex - 1);
  }

  function showNext() {
    showSlide(activeIndex + 1);
  }

  function handleKeyDown(event) {
    if (!hasMultipleSlides) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    }
  }

  return (
    <section
      aria-label={label}
      className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      onKeyDown={handleKeyDown}
      role="region"
      tabIndex={0}
    >
      <div className="p-3 sm:p-4">
        {slideCount === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 text-center text-sm font-medium text-gray-600">
            No product images are available.
          </div>
        ) : (
          <>
            <div
              className="relative w-full overflow-hidden rounded-xl bg-gray-100"
              data-testid="image-carousel-viewport"
            >
              <div
                className="flex w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-reduce:transition-none"
                data-testid="image-carousel-track"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {slides.map((image, index) => (
                  <div
                    aria-hidden={index !== activeIndex}
                    className="w-full min-w-0 flex-none shrink-0"
                    key={`${image.src}-${index}`}
                  >
                    <img
                      alt={image.alt}
                      className="block aspect-[4/3] h-auto max-h-[70vh] w-full object-cover"
                      draggable="false"
                      src={image.src}
                    />
                  </div>
                ))}
              </div>

              {hasMultipleSlides ? (
                <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-4">
                  <button
                    aria-label="Previous slide"
                    className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-gray-900 shadow transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    onClick={showPrevious}
                    type="button"
                  >
                    <span aria-hidden="true">‹</span>
                  </button>
                  <button
                    aria-label="Next slide"
                    className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-2xl font-semibold text-gray-900 shadow transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    onClick={showNext}
                    type="button"
                  >
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex flex-col items-center gap-3 text-sm text-gray-700 sm:flex-row sm:justify-between">
              <p aria-live="polite" className="font-medium">
                {activeSlide
                  ? `${activeSlide.alt} — slide ${activeIndex + 1} of ${slideCount}`
                  : null}
              </p>

              {hasMultipleSlides ? (
                <div
                  aria-label="Choose product image"
                  className="flex max-w-full flex-wrap justify-center gap-2"
                  role="group"
                >
                  {slides.map((image, index) => {
                    const isCurrent = index === activeIndex;

                    return (
                      <button
                        aria-current={isCurrent ? 'true' : undefined}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`h-3 w-3 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                          isCurrent
                            ? 'bg-blue-600'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        key={`${image.alt}-${index}`}
                        onClick={() => showSlide(index)}
                        type="button"
                      >
                        <span className="sr-only">
                          {isCurrent ? 'Current slide: ' : ''}
                          {image.alt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      alt: PropTypes.string.isRequired,
      src: PropTypes.string.isRequired,
    })
  ),
  label: PropTypes.string,
};
