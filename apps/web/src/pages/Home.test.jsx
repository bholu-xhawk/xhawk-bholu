import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Home, { BATCH_SIZE, MAX_RETAINED_IMAGES } from './Home.jsx';

let observers;
let scrollByMock;

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observe = jest.fn();
    this.disconnect = jest.fn();
    observers.push(this);
  }

  trigger(isIntersecting = true) {
    this.callback([{ isIntersecting }]);
  }
}

function makeImage(id, author = `Author ${id}`) {
  return {
    id: String(id),
    src: `https://example.com/${id}.jpg`,
    width: Number(id) % 2 === 0 ? 1200 : 900,
    height: Number(id) % 2 === 0 ? 800 : 1200,
    author,
    alt: `Random photo by ${author}`,
  };
}

function makeBatch(start, count = BATCH_SIZE) {
  return Array.from({ length: count }, (_, index) => makeImage(start + index));
}

function responseWith(images, ok = true) {
  return Promise.resolve({
    ok,
    json: jest.fn().mockResolvedValue({ images }),
  });
}

function latestObserver() {
  return observers[observers.length - 1];
}

beforeEach(() => {
  observers = [];
  globalThis.IntersectionObserver = MockIntersectionObserver;
  globalThis.fetch = jest.fn();
  scrollByMock = jest.fn();
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', {
    configurable: true,
    value: scrollByMock,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return 500;
    },
  });
});

afterEach(() => {
  delete globalThis.IntersectionObserver;
  delete globalThis.fetch;
});

describe('Home album carousel', () => {
  it('requests an initial image batch and renders accessible image cards', async () => {
    globalThis.fetch.mockResolvedValueOnce(await responseWith([makeImage(1, 'Ada'), makeImage(2, 'Grace')]));

    render(<Home />);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/images?count=8', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(await screen.findByRole('img', { name: 'Random photo by Ada' })).toBeInTheDocument();
    expect(screen.getByText('Grace')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 photos loaded');
  });

  it('appends sentinel-loaded images and filters duplicates', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(await responseWith([makeImage(1, 'Ada'), makeImage(2, 'Grace')]))
      .mockResolvedValueOnce(await responseWith([makeImage(2, 'Grace'), makeImage(3, 'Katherine')]));

    render(<Home />);
    expect(await screen.findByRole('img', { name: 'Random photo by Ada' })).toBeInTheDocument();

    act(() => {
      latestObserver().trigger();
    });

    expect(await screen.findByRole('img', { name: 'Random photo by Katherine' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Random photo by Grace' })).toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('guards against concurrent observer-triggered loads', async () => {
    let resolveInitial;
    globalThis.fetch.mockReturnValueOnce(new Promise((resolve) => {
      resolveInitial = resolve;
    }));

    render(<Home />);

    act(() => {
      latestObserver().trigger();
      latestObserver().trigger();
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveInitial(await responseWith([makeImage(1)]));
    });

    expect(await screen.findByRole('img', { name: 'Random photo by Author 1' })).toBeInTheDocument();
  });

  it('retains a bounded number of cards when more batches are appended', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(await responseWith(makeBatch(1)))
      .mockResolvedValueOnce(await responseWith(makeBatch(9)))
      .mockResolvedValueOnce(await responseWith(makeBatch(17)))
      .mockResolvedValueOnce(await responseWith(makeBatch(25)));

    render(<Home />);
    expect(await screen.findByRole('img', { name: 'Random photo by Author 1' })).toBeInTheDocument();

    for (let callCount = 2; callCount <= 4; callCount += 1) {
      act(() => {
        latestObserver().trigger();
      });
      await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(callCount));
      expect(await screen.findByRole('img', { name: `Random photo by Author ${(callCount - 1) * BATCH_SIZE + 1}` })).toBeInTheDocument();
    }

    const carousel = screen.getByTestId('photo-carousel');
    expect(within(carousel).getAllByRole('img')).toHaveLength(MAX_RETAINED_IMAGES);
    expect(screen.queryByRole('img', { name: 'Random photo by Author 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Random photo by Author 32' })).toBeInTheDocument();
  });

  it('offers retry after an initial failed request', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(await responseWith([], false))
      .mockResolvedValueOnce(await responseWith([makeImage(7, 'Retry Author')]));

    render(<Home />);

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load more photos');
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByRole('img', { name: 'Random photo by Retry Author' })).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps already loaded images visible when a later request fails', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(await responseWith([makeImage(1, 'Ada')]))
      .mockResolvedValueOnce(await responseWith([], false));

    render(<Home />);
    expect(await screen.findByRole('img', { name: 'Random photo by Ada' })).toBeInTheDocument();

    act(() => {
      latestObserver().trigger();
    });

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Random photo by Ada' })).toBeInTheDocument();
  });

  it('scrolls with labelled previous and next controls', async () => {
    globalThis.fetch.mockResolvedValueOnce(await responseWith([makeImage(1)]));

    render(<Home />);
    expect(await screen.findByRole('img', { name: 'Random photo by Author 1' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next photos/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous photos/i }));

    expect(scrollByMock).toHaveBeenNthCalledWith(1, { left: 400, behavior: 'smooth' });
    expect(scrollByMock).toHaveBeenNthCalledWith(2, { left: -400, behavior: 'smooth' });
  });
});
