import { fetchBooks, updateBookStarred } from './books.js';

function jsonResponse(body, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe('books API client', () => {
  const originalApiUrl = globalThis.process.env.VITE_BOOKS_API_URL;

  beforeEach(() => {
    globalThis.fetch = jest.fn();
    delete globalThis.process.env.VITE_BOOKS_API_URL;
  });

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete globalThis.process.env.VITE_BOOKS_API_URL;
    } else {
      globalThis.process.env.VITE_BOOKS_API_URL = originalApiUrl;
    }
    jest.restoreAllMocks();
  });

  it('fetches books from the default backend URL', async () => {
    const books = [
      {
        id: 'book-1',
        name: 'Dune',
        authors: ['Frank Herbert'],
        starred: false,
      },
    ];
    globalThis.fetch.mockResolvedValue(jsonResponse(books));

    await expect(fetchBooks()).resolves.toEqual(books);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/books',
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
  });

  it('uses VITE_BOOKS_API_URL when configured', async () => {
    globalThis.process.env.VITE_BOOKS_API_URL = 'http://localhost:4000/';
    globalThis.fetch.mockResolvedValue(jsonResponse([]));

    await fetchBooks();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/books',
      expect.any(Object)
    );
  });

  it('patches the starred state as JSON', async () => {
    const updatedBook = {
      id: 'book-1',
      name: 'Dune',
      authors: ['Frank Herbert'],
      starred: true,
    };
    globalThis.fetch.mockResolvedValue(jsonResponse(updatedBook));

    await expect(updateBookStarred('book-1', true)).resolves.toEqual(
      updatedBook
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/books/book-1/starred',
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ starred: true }),
      }
    );
  });

  it('throws a clear error for non-2xx JSON responses', async () => {
    globalThis.fetch.mockResolvedValue(
      jsonResponse(
        { error: 'starred must be a boolean' },
        { ok: false, status: 400 }
      )
    );

    await expect(updateBookStarred('book-1', 'yes')).rejects.toThrow(
      'starred must be a boolean'
    );
  });
});
