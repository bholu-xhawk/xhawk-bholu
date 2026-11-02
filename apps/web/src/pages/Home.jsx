import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BATCH_SIZE = 8;
const MAX_RETAINED_IMAGES = 24;
const MIN_CARD_WIDTH = 15;
const MAX_CARD_WIDTH = 24;

function mergeUniqueImages(currentImages, nextImages) {
  const seen = new Set(currentImages.map((image) => image.id));
  const merged = [...currentImages];

  nextImages.forEach((image) => {
    if (!image?.id || seen.has(image.id)) {
      return;
    }
    seen.add(image.id);
    merged.push(image);
  });

  return merged.slice(Math.max(0, merged.length - MAX_RETAINED_IMAGES));
}

function getCardWidth(image) {
  const ratio = image.width / image.height;
  const width = 18 * ratio;
  return Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, width));
}

export default function Home() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const carouselRef = useRef(null);
  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const loadingRef = useRef(false);
  const lastRemovedCountRef = useRef(0);
  const didInitialLoadRef = useRef(false);

  const hasImages = images.length > 0;

  const loadImages = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/images?count=${BATCH_SIZE}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('Image request failed');
      }

      const payload = await response.json();
      if (!Array.isArray(payload.images)) {
        throw new Error('Image response was malformed');
      }

      setImages((currentImages) => {
        const merged = mergeUniqueImages(currentImages, payload.images);
        lastRemovedCountRef.current = Math.max(0, currentImages.length + payload.images.length - merged.length);
        return merged;
      });
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError('We could not load more photos. Please try again.');
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!didInitialLoadRef.current) {
      didInitialLoadRef.current = true;
      loadImages();
    }

    return () => {
      abortRef.current?.abort();
    };
  }, [loadImages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadImages();
        }
      },
      {
        root: carouselRef.current,
        rootMargin: '0px 240px 0px 0px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadImages, images.length]);

  useEffect(() => {
    if (lastRemovedCountRef.current === 0 || !carouselRef.current) {
      return;
    }

    const estimatedRemovedWidth = lastRemovedCountRef.current * 280;
    carouselRef.current.scrollLeft = Math.max(0, carouselRef.current.scrollLeft - estimatedRemovedWidth);
    lastRemovedCountRef.current = 0;
  }, [images.length]);

  const statusText = useMemo(() => {
    if (isLoading && !hasImages) {
      return 'Loading photos…';
    }
    if (isLoading) {
      return 'Loading more photos…';
    }
    return `${images.length} photos loaded`;
  }, [hasImages, images.length, isLoading]);

  const scrollAlbum = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) {
      return;
    }

    const distance = Math.max(320, carousel.clientWidth * 0.8) * direction;
    carousel.scrollBy({ left: distance, behavior: 'smooth' });
  };

  return (
    <section className="album-page" aria-labelledby="album-title">
      <div className="album-hero">
        <p className="album-kicker">Infinite photo album</p>
        <h1 id="album-title" className="text-3xl font-bold">Home</h1>
        <p className="album-copy">
          Explore a horizontally scrolling collection of random images. New photos load as you approach the end.
        </p>
      </div>

      <div className="album-toolbar" aria-label="Photo album controls">
        <button type="button" className="album-control" onClick={() => scrollAlbum(-1)} aria-label="Scroll to previous photos">
          ←
        </button>
        <p className="album-status" role="status" aria-live="polite">{statusText}</p>
        <button type="button" className="album-control" onClick={() => scrollAlbum(1)} aria-label="Scroll to next photos">
          →
        </button>
      </div>

      <div ref={carouselRef} className="album-carousel" aria-label="Random photo carousel" data-testid="photo-carousel">
        {images.map((image) => (
          <article
            className="album-card"
            key={image.id}
            style={{
              '--card-aspect': `${image.width} / ${image.height}`,
              '--card-width': `${getCardWidth(image)}rem`,
            }}
          >
            <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" />
            <div className="album-card-caption">
              <span>Photo by</span>
              <strong>{image.author}</strong>
            </div>
          </article>
        ))}

        {isLoading && (
          <div className="album-card album-card--placeholder" aria-label="Loading photo placeholder">
            <span>Loading…</span>
          </div>
        )}

        <div ref={sentinelRef} className="album-sentinel" aria-hidden="true" data-testid="album-sentinel" />
      </div>

      {!isLoading && !hasImages && !error && <p className="album-empty">No photos are available yet.</p>}

      {error && (
        <div className="album-error" role="alert">
          <p>{error}</p>
          <button type="button" className="album-retry" onClick={loadImages}>Retry</button>
        </div>
      )}
    </section>
  );
}

export { BATCH_SIZE, MAX_RETAINED_IMAGES, mergeUniqueImages };
