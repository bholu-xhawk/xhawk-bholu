import {
  BOOKS_API_BASE_URL,
  fetchBooks,
  normalizeBook,
  updateBookStarred,
} from './books.js';

describe('books API client', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockJsonResponse(body, options = {}) {
    globalThis.fetch.mockResolvedValue({
      ok: options.ok ?? true,
      status: options.status ?? 200,
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    });
  }

  it('exports the configured books API base URL with the localhost default', () => {
    expect(BOOKS_API_BASE_URL).toBe('http://localhost:8000');
  });

  it('normalizes book fields, author arrays, author strings, variants, and defaults', () => {
    expect(
      normalizeBook({
        bookId: 'a-1',
        bookName: 'Clean Architecture',
        description: 'Software design guidance',
        authors: ['Robert C. Martin', ' Uncle Bob '],
        isStarred: true,
      })
    ).toEqual({
      id: 'a-1',
      name: 'Clean Architecture',
      details: 'Software design guidance',
      authors: 'Robert C. Martin, Uncle Bob',
      starred: true,
    });

    expect(
      normalizeBook({ id: 2, title: 'Refactoring', author: 'Martin Fowler' })
    ).toEqual({
      id: 2,
      name: 'Refactoring',
      details: '',
      authors: 'Martin Fowler',
      starred: false,
    });

    expect(normalizeBook({})).toEqual({
      id: '',
      name: 'Untitled book',
      details: '',
      authors: '',
      starred: false,
    });
  });

  it('fetches and normalizes books from GET /books', async () => {
    mockJsonResponse([
      {
        id: '1',
        name: 'Dune',
        details: 'Desert planet',
        authors: ['Frank Herbert'],
        starred: false,
      },
    ]);

    await expect(fetchBooks()).resolves.toEqual([
      {
        id: '1',
        name: 'Dune',
        details: 'Desert planet',
        authors: 'Frank Herbert',
        starred: false,
      },
    ]);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/books',
      {
        headers: { Accept: 'application/json' },
      }
    );
  });

  it('rejects GET /books when the response is not an array', async () => {
    mockJsonResponse({ books: [] });

    await expect(fetchBooks()).rejects.toThrow('unexpected response');
  });

  it('sends PATCH /books/:id/star with the desired starred value', async () => {
    mockJsonResponse({
      id: 'book 1',
      name: 'Dune',
      authors: 'Frank Herbert',
      starred: true,
    });

    await expect(updateBookStarred('book 1', true)).resolves.toEqual({
      id: 'book 1',
      name: 'Dune',
      details: '',
      authors: 'Frank Herbert',
      starred: true,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/books/book%201/star',
      {
        method: 'PATCH',
        body: JSON.stringify({ starred: true }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('throws API error details for non-OK responses', async () => {
    mockJsonResponse({ detail: 'Book not found' }, { ok: false, status: 404 });

    await expect(updateBookStarred('missing', false)).rejects.toThrow(
      'Book not found'
    );
  });
});
