import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ImageCarousel, { createImageBatch } from './ImageCarousel.jsx';

const observers = [];
const scrollByMock = jest.fn();

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    observers.push(this);
  }

  trigger(entries) {
    this.callback(entries, this);
  }
}

describe('ImageCarousel', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });

    Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
      writable: true,
      configurable: true,
      value: scrollByMock,
    });
  });

  beforeEach(() => {
    observers.length = 0;
    scrollByMock.mockClear();
  });

  it('renders an initial stable batch with mixed image dimensions and reserved card widths', () => {
    render(<ImageCarousel />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(8);
    expect(screen.getByRole('region', { name: /continuous photo carousel/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('8 photos ready');

    const initialBatch = createImageBatch(0);
    expect(new Set(initialBatch.map((image) => `${image.width}x${image.height}`)).size).toBeGreaterThan(1);
    expect(new Set(initialBatch.map((image) => image.src)).size).toBe(8);

    expect(images[0]).toHaveAttribute('src', initialBatch[0].src);
    expect(images[0]).toHaveAttribute('width', String(initialBatch[0].width));
    expect(images[0]).toHaveAttribute('height', String(initialBatch[0].height));
    expect(images[1]).toHaveAttribute('src', initialBatch[1].src);

    const cards = screen.getAllByRole('listitem');
    expect(cards[0]).toHaveStyle({ width: `${initialBatch[0].width}px` });
    expect(cards[1]).toHaveStyle({ width: `${initialBatch[1].width}px` });
  });

  it('scrolls the horizontal track with accessible previous and next controls', () => {
    render(<ImageCarousel />);

    fireEvent.click(screen.getByRole('button', { name: /scroll to next photos/i }));
    fireEvent.click(screen.getByRole('button', { name: /scroll to previous photos/i }));

    expect(scrollByMock).toHaveBeenNthCalledWith(1, { left: 520, behavior: 'smooth' });
    expect(scrollByMock).toHaveBeenNthCalledWith(2, { left: -520, behavior: 'smooth' });
  });

  it('appends exactly one guarded batch when the sentinel intersects repeatedly', () => {
    jest.useFakeTimers();
    render(<ImageCarousel />);

    expect(observers).toHaveLength(1);

    act(() => {
      observers[0].trigger([{ isIntersecting: true }]);
      observers[0].trigger([{ isIntersecting: true }]);
    });

    expect(screen.getAllByRole('img')).toHaveLength(16);
    expect(screen.getByRole('status')).toHaveTextContent('Loading more photos…');

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(screen.getByRole('status')).toHaveTextContent('16 photos ready');
    jest.useRealTimers();
  });

  it('observes the end sentinel and disconnects during cleanup', () => {
    const { unmount } = render(<ImageCarousel />);
    const track = screen.getByRole('list', { name: /random image carousel/i });
    const sentinel = screen.getByTestId('carousel-sentinel');

    expect(observers).toHaveLength(1);
    expect(observers[0].options.root).toBe(track);
    expect(observers[0].observe).toHaveBeenCalledWith(sentinel);

    unmount();

    expect(observers[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('shows a fallback for a failed image and replaces it with a retry image', () => {
    render(<ImageCarousel />);

    const firstImage = screen.getAllByRole('img')[0];
    const originalSrc = firstImage.getAttribute('src');

    fireEvent.error(firstImage);

    expect(screen.getByText(/this photo could not load/i)).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(7);

    fireEvent.click(screen.getByRole('button', { name: /try another image/i }));

    const replacementImage = screen.getAllByRole('img')[0];
    expect(screen.queryByText(/this photo could not load/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(8);
    expect(replacementImage).toHaveAttribute('src', expect.stringContaining('try-2'));
    expect(replacementImage.getAttribute('src')).not.toBe(originalSrc);
  });
});
