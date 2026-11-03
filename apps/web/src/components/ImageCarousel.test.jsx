import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ImageCarousel from './ImageCarousel.jsx';

const observerInstances = [];
const scrollByMock = jest.fn();
let originalIntersectionObserver;
let originalRequestAnimationFrame;
let originalScrollBy;
let originalClientWidth;
let originalScrollWidth;

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    observerInstances.push(this);
  }
}

describe('ImageCarousel', () => {
  beforeEach(() => {
    observerInstances.length = 0;
    scrollByMock.mockClear();
    originalIntersectionObserver = globalThis.IntersectionObserver;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalScrollBy = window.HTMLElement.prototype.scrollBy;
    originalClientWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'clientWidth');
    originalScrollWidth = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'scrollWidth');
    globalThis.IntersectionObserver = MockIntersectionObserver;
    window.requestAnimationFrame = (callback) => callback();
    window.HTMLElement.prototype.scrollBy = scrollByMock;
    Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return this.getAttribute('aria-label') === 'Horizontally scrolling random photo album'
          ? 500
          : 0;
      },
    });
    Object.defineProperty(window.HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return this.getAttribute('aria-label') === 'Horizontally scrolling random photo album'
          ? 1600
          : 0;
      },
    });
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.HTMLElement.prototype.scrollBy = originalScrollBy;
    if (originalClientWidth) {
      Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', originalClientWidth);
    } else {
      delete window.HTMLElement.prototype.clientWidth;
    }
    if (originalScrollWidth) {
      Object.defineProperty(window.HTMLElement.prototype, 'scrollWidth', originalScrollWidth);
    } else {
      delete window.HTMLElement.prototype.scrollWidth;
    }
    jest.restoreAllMocks();
  });

  it('renders an initial varied batch with stable provider URLs and loading placeholders', () => {
    render(<ImageCarousel />);

    const images = screen.getAllByRole('img', { name: /curated album photo/i });
    expect(images).toHaveLength(8);
    expect(images[0]).toHaveAttribute('src', 'https://picsum.photos/seed/album-0-0/320/420');
    expect(images[1]).toHaveAttribute('src', 'https://picsum.photos/seed/album-0-1/420/320');
    expect(images[0].closest('article')).not.toHaveClass(images[1].closest('article').className);
    expect(screen.getByLabelText('Loading curated album photo 1')).toBeInTheDocument();
    expect(observerInstances[0].observe).toHaveBeenCalledWith(screen.getByTestId('carousel-end-sentinel'));
    expect(observerInstances[0].options.root).toBe(screen.getByRole('group', { name: /random photo album/i }));
  });

  it('scrolls with previous and next controls', () => {
    render(<ImageCarousel />);

    const strip = screen.getByRole('group', { name: /random photo album/i });
    const previousButton = screen.getByRole('button', { name: /scroll to previous photos/i });
    const nextButton = screen.getByRole('button', { name: /scroll to next photos/i });

    expect(previousButton).toBeDisabled();

    fireEvent.click(nextButton);
    expect(scrollByMock).toHaveBeenLastCalledWith({ left: 425, behavior: 'smooth' });

    Object.defineProperty(strip, 'scrollLeft', { configurable: true, value: 300 });
    fireEvent.scroll(strip);
    expect(previousButton).not.toBeDisabled();

    fireEvent.click(previousButton);
    expect(scrollByMock).toHaveBeenLastCalledWith({ left: -425, behavior: 'smooth' });
  });

  it('appends one guarded batch per accepted end-sentinel trigger and preserves existing cards', () => {
    render(<ImageCarousel />);

    const firstImage = screen.getByRole('img', { name: 'Curated album photo 1' });
    const firstImageSource = firstImage.getAttribute('src');

    act(() => {
      observerInstances[0].callback([{ isIntersecting: true }]);
      observerInstances[0].callback([{ isIntersecting: true }]);
    });

    expect(screen.getAllByRole('img', { name: /curated album photo/i })).toHaveLength(12);
    expect(screen.getByRole('img', { name: 'Curated album photo 1' })).toHaveAttribute(
      'src',
      firstImageSource
    );
    expect(screen.getByRole('img', { name: 'Curated album photo 12' })).toHaveAttribute(
      'src',
      'https://picsum.photos/seed/album-1-3/320/420'
    );

    const latestObserver = observerInstances[observerInstances.length - 1];
    act(() => {
      latestObserver.callback([{ isIntersecting: true }]);
    });

    expect(screen.getAllByRole('img', { name: /curated album photo/i })).toHaveLength(16);
    expect(screen.getByRole('img', { name: 'Curated album photo 16' })).toBeInTheDocument();
  });

  it('disconnects the shared observer during cleanup', () => {
    const { unmount } = render(<ImageCarousel />);
    const observer = observerInstances[0];

    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('isolates image failure and allows retrying the failed card', () => {
    render(<ImageCarousel />);

    const failedImage = screen.getByRole('img', { name: 'Curated album photo 1' });
    const unaffectedImage = screen.getByRole('img', { name: 'Curated album photo 2' });

    fireEvent.error(failedImage);

    expect(screen.getByText('This photo could not load.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry Curated album photo 1' })).toBeInTheDocument();
    expect(unaffectedImage).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry Curated album photo 1' }));

    const retriedImage = screen.getByRole('img', { name: 'Curated album photo 1' });
    expect(retriedImage).toHaveAttribute(
      'src',
      'https://picsum.photos/seed/album-0-0/320/420?retry=1'
    );

    fireEvent.load(retriedImage);

    expect(screen.queryByText('This photo could not load.')).not.toBeInTheDocument();
    expect(retriedImage).toHaveClass('opacity-100');
  });
});
