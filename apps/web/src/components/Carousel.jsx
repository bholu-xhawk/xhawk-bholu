import React, { useEffect, useMemo, useState } from 'react';

export default function Carousel({ images: propImages }) {
  const [images, setImages] = useState(propImages || []);
  const [loading, setLoading] = useState(!propImages);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!propImages) {
      (async () => {
        try {
          const res = await fetch('/api/carousel-images');
          if (!res.ok) throw new Error('Failed to fetch images');
          const data = await res.json();
          if (mounted) setImages(data);
        } catch (e) {
          console.error(e);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [propImages]);

  useEffect(() => {
    if (propImages) {
      setImages(propImages);
      setLoading(false);
    }
  }, [propImages]);

  const count = images.length;

  const prev = () => setIndex((i) => (i - 1 + count) % Math.max(count, 1));
  const next = () => setIndex((i) => (i + 1) % Math.max(count, 1));

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  const trackStyle = useMemo(() => ({
    transform: `translateX(-${index * 100}%)`,
    transition: 'transform 400ms ease',
  }), [index]);

  if (loading) return <div className="w-full h-64 md:h-96 flex items-center justify-center">Loading…</div>;
  if (!count) return <div className="w-full h-64 md:h-96 flex items-center justify-center">No images</div>;

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex w-full" style={trackStyle}>
        {images.map((img, i) => (
          <div key={img.id || i} className="w-full flex-none">
            <div className="w-full h-64 md:h-96 relative">
              <img
                src={img.url}
                alt={img.alt || ''}
                className="w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
              {(img.title || img.caption) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
                  {img.title && <div className="font-semibold">{img.title}</div>}
                  {img.caption && <div className="text-sm">{img.caption}</div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous slide"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full px-3 py-1 shadow"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full px-3 py-1 shadow"
      >
        ›
      </button>
    </div>
  );
}
