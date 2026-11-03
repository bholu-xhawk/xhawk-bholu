import React, { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_BATCH_SIZE = 8;
const NEXT_BATCH_SIZE = 4;

const SIZE_VARIANTS = [
  { width: 320, height: 420, className: 'w-64 sm:w-72 h-80 sm:h-96' },
  { width: 420, height: 320, className: 'w-72 sm:w-96 h-64 sm:h-72' },
  { width: 300, height: 300, className: 'w-60 sm:w-72 h-60 sm:h-72' },
  { width: 360, height: 460, className: 'w-64 sm:w-80 h-80 sm:h-[26rem]' },
];

function createImageBatch(batchIndex, count) {
  return Array.from({ length: count }, (_, itemIndex) => {
    const variant = SIZE_VARIANTS[(batchIndex + itemIndex) % SIZE_VARIANTS.length];
    const id = `album-${batchIndex}-${itemIndex}`;

    const imageNumber =
      batchIndex === 0
        ? itemIndex + 1
        : INITIAL_BATCH_SIZE + (batchIndex - 1) * NEXT_BATCH_SIZE + itemIndex + 1;

    return {
      id,
      batchIndex,
      itemIndex,
      alt: `Curated album photo ${imageNumber}`,
      providerUrl: `https://picsum.photos/seed/${id}/${variant.width}/${variant.height}`,
      sizeClassName: variant.className,
    };
  });
}

export default function ImageCarousel() {
  const [images, setImages] = useState(() => createImageBatch(0, INITIAL_BATCH_SIZE));
  const [imageStatus, setImageStatus] = useState({});
  const [retryCounts, setRetryCounts] = useState({});
  const [batchIndex, setBatchIndex] = useState(1);
  const [isAppending, setIsAppending] = useState(false);
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const stripRef = useRef(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const appendingRef = useRef(false);

  const updateScrollControls = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const maxScrollLeft = strip.scrollWidth - strip.clientWidth;
    setCanScrollPrevious(strip.scrollLeft > 4);
    setCanScrollNext(maxScrollLeft > 4 && strip.scrollLeft < maxScrollLeft - 4);
  }, []);

  const appendImageBatch = useCallback(() => {
    if (appendingRef.current) return;

    appendingRef.current = true;
    setIsAppending(true);
    setImages((currentImages) => [
      ...currentImages,
      ...createImageBatch(batchIndex, NEXT_BATCH_SIZE),
    ]);
    setBatchIndex((currentBatchIndex) => currentBatchIndex + 1);
  }, [batchIndex]);

  useEffect(() => {
    if (!isAppending) return;

    appendingRef.current = false;
    setIsAppending(false);
    window.requestAnimationFrame(updateScrollControls);
  }, [images.length, isAppending, updateScrollControls]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const strip = stripRef.current;

    if (!sentinel || !strip || typeof IntersectionObserver === 'undefined') return undefined;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          appendImageBatch();
        }
      },
      {
        root: strip,
        rootMargin: '0px 320px 0px 0px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [appendImageBatch]);

  useEffect(() => {
    updateScrollControls();
  }, [images.length, updateScrollControls]);

  const scrollByPage = (direction) => {
    const strip = stripRef.current;
    if (!strip) return;

    strip.scrollBy({
      left: direction * Math.max(strip.clientWidth * 0.85, 280),
      behavior: 'smooth',
    });
  };

  const markImageLoaded = (id) => {
    setImageStatus((currentStatus) => ({ ...currentStatus, [id]: 'loaded' }));
  };

  const markImageFailed = (id) => {
    setImageStatus((currentStatus) => ({ ...currentStatus, [id]: 'error' }));
  };

  const retryImage = (id) => {
    setImageStatus((currentStatus) => ({ ...currentStatus, [id]: 'loading' }));
    setRetryCounts((currentCounts) => ({ ...currentCounts, [id]: (currentCounts[id] ?? 0) + 1 }));
  };

  return (
    <section
      className="space-y-4"
      aria-labelledby="photo-carousel-heading"
      aria-roledescription="carousel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="photo-carousel-heading" className="text-2xl font-semibold text-gray-950">
            Endless photo album
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Scroll sideways or use the controls to browse new photos as the album grows.
          </p>
        </div>
        <div className="flex gap-2" aria-label="Carousel controls">
          <button
            type="button"
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollPrevious}
            aria-label="Scroll to previous photos"
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollNext}
            aria-label="Scroll to next photos"
          >
            Next
          </button>
        </div>
      </div>

      <div
        ref={stripRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 pr-10"
        role="group"
        aria-label="Horizontally scrolling random photo album"
        tabIndex={0}
        onScroll={updateScrollControls}
      >
        {images.map((image) => {
          const status = imageStatus[image.id] ?? 'loading';
          const retryCount = retryCounts[image.id] ?? 0;
          const source = retryCount > 0 ? `${image.providerUrl}?retry=${retryCount}` : image.providerUrl;

          return (
            <article
              key={image.id}
              className={`relative flex-none snap-start overflow-hidden rounded-3xl bg-gray-200 shadow-lg ${image.sizeClassName}`}
            >
              {status !== 'loaded' && status !== 'error' ? (
                <div
                  className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300"
                  aria-label={`Loading ${image.alt.toLowerCase()}`}
                />
              ) : null}

              {status === 'error' ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/85 p-6 text-center text-white">
                  <p className="text-sm font-medium">This photo could not load.</p>
                  <button
                    type="button"
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                    onClick={() => retryImage(image.id)}
                    aria-label={`Retry ${image.alt}`}
                  >
                    Retry photo
                  </button>
                </div>
              ) : (
                <img
                  key={`${image.id}-${retryCount}`}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${
                    status === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`}
                  src={source}
                  alt={image.alt}
                  loading="lazy"
                  onLoad={() => markImageLoaded(image.id)}
                  onError={() => markImageFailed(image.id)}
                />
              )}
            </article>
          );
        })}
        <div
          ref={sentinelRef}
          className="h-1 w-1 flex-none self-center"
          aria-hidden="true"
          data-testid="carousel-end-sentinel"
        />
        {isAppending ? (
          <div className="flex h-64 w-56 flex-none snap-start items-center justify-center rounded-3xl bg-gray-200 text-sm text-gray-500">
            Loading more photos…
          </div>
        ) : null}
      </div>
    </section>
  );
}
