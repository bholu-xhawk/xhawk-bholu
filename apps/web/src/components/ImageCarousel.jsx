import React, { useCallback, useEffect, useRef, useState } from 'react';

const BATCH_SIZE = 8;
const SCROLL_DISTANCE = 520;
const DIMENSION_PRESETS = [
  { width: 420, height: 280, label: 'landscape' },
  { width: 320, height: 420, label: 'portrait' },
  { width: 360, height: 360, label: 'square' },
  { width: 520, height: 320, label: 'panoramic' },
  { width: 300, height: 390, label: 'vertical' },
  { width: 460, height: 300, label: 'wide' },
];

function createDescriptor(index, attempt = 0) {
  const dimensions = DIMENSION_PRESETS[index % DIMENSION_PRESETS.length];
  const seed = `home-carousel-${index + 1}-${dimensions.label}-try-${attempt + 1}`;

  return {
    id: `photo-${index + 1}`,
    index,
    attempt,
    seed,
    width: dimensions.width,
    height: dimensions.height,
    src: `https://picsum.photos/seed/${seed}/${dimensions.width}/${dimensions.height}`,
    alt: `Random ${dimensions.label} gallery image ${index + 1}`,
  };
}

export function createImageBatch(batchIndex, batchSize = BATCH_SIZE) {
  const start = batchIndex * batchSize;

  return Array.from({ length: batchSize }, (_, offset) => createDescriptor(start + offset));
}

export default function ImageCarousel() {
  const [images, setImages] = useState(() => createImageBatch(0));
  const [failedImages, setFailedImages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const trackRef = useRef(null);
  const sentinelRef = useRef(null);
  const batchRef = useRef(1);
  const loadingRef = useRef(false);
  const releaseTimerRef = useRef(null);

  const appendImageBatch = useCallback(() => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    setImages((currentImages) => {
      const nextBatch = createImageBatch(batchRef.current);
      batchRef.current += 1;
      return [...currentImages, ...nextBatch];
    });

    if (releaseTimerRef.current) {
      window.clearTimeout(releaseTimerRef.current);
    }

    releaseTimerRef.current = window.setTimeout(() => {
      loadingRef.current = false;
      setIsLoading(false);
      releaseTimerRef.current = null;
    }, 0);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = trackRef.current;

    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          appendImageBatch();
        }
      },
      {
        root,
        rootMargin: '0px 320px 0px 0px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [appendImageBatch]);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current) {
        window.clearTimeout(releaseTimerRef.current);
      }
    };
  }, []);

  const scrollTrack = (direction) => {
    trackRef.current?.scrollBy({
      left: direction * SCROLL_DISTANCE,
      behavior: 'smooth',
    });
  };

  const markImageFailed = (imageId) => {
    setFailedImages((currentFailures) => ({ ...currentFailures, [imageId]: true }));
  };

  const replaceFailedImage = (image) => {
    setImages((currentImages) =>
      currentImages.map((currentImage) =>
        currentImage.id === image.id ? createDescriptor(image.index, image.attempt + 1) : currentImage
      )
    );
    setFailedImages((currentFailures) => {
      const nextFailures = { ...currentFailures };
      delete nextFailures[image.id];
      return nextFailures;
    });
  };

  return (
    <section
      className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
      aria-labelledby="image-carousel-heading"
    >
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="image-carousel-heading" className="text-2xl font-semibold text-gray-950">
            Continuous photo carousel
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Swipe or scroll through seeded random photos. More images are prepared as you near the end of the strip.
          </p>
        </div>
        <div className="flex gap-2" aria-label="Carousel scrolling controls">
          <button
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
            aria-label="Scroll to previous photos"
            onClick={() => scrollTrack(-1)}
          >
            Previous
          </button>
          <button
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="button"
            aria-label="Scroll to next photos"
            onClick={() => scrollTrack(1)}
          >
            Next
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-4"
        role="list"
        aria-label="Random image carousel"
      >
        {images.map((image) => {
          const hasFailed = failedImages[image.id];

          return (
            <article
              className="relative flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200"
              key={image.id}
              role="listitem"
              style={{ width: `${image.width}px`, maxWidth: '78vw' }}
            >
              <div className="relative bg-gray-200" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
                {hasFailed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-gray-700">
                    <p className="text-sm font-medium">This photo could not load.</p>
                    <button
                      className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      type="button"
                      onClick={() => replaceFailedImage(image)}
                    >
                      Try another image
                    </button>
                  </div>
                ) : (
                  <img
                    className="h-full w-full object-cover"
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    onError={() => markImageFailed(image.id)}
                  />
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-600">
                <span>{image.width} × {image.height}</span>
                <span>Seed {image.index + 1}</span>
              </div>
            </article>
          );
        })}
        <div
          ref={sentinelRef}
          className="flex w-6 shrink-0 items-center justify-center text-sm text-gray-500"
          aria-hidden="true"
          data-testid="carousel-sentinel"
        />
      </div>

      <p className="mt-3 text-sm text-gray-600" role="status" aria-live="polite">
        {isLoading ? 'Loading more photos…' : `${images.length} photos ready`}
      </p>
    </section>
  );
}
