import { BOOKS_API_BASE_URL } from './env.js';

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function buildUrl(path) {
  return `${trimTrailingSlash(BOOKS_API_BASE_URL)}${path}`;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Books API returned invalid JSON.');
  }
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const body = await parseJsonResponse(response);

  if (!response.ok) {
    const message =
      body?.message ||
      body?.detail ||
      `Books API request failed with ${response.status}.`;
    throw new Error(message);
  }

  return body;
}

function normalizeAuthors(authors) {
  if (Array.isArray(authors)) {
    return authors
      .map((author) => String(author ?? '').trim())
      .filter(Boolean)
      .join(', ');
  }

  return String(authors ?? '').trim();
}

export function normalizeBook(book = {}) {
  return {
    id: book.id ?? book.bookId ?? book._id ?? '',
    name: String(book.name ?? book.bookName ?? book.title ?? 'Untitled book'),
    details: String(book.details ?? book.description ?? ''),
    authors: normalizeAuthors(book.authors ?? book.author),
    starred: Boolean(book.starred ?? book.isStarred ?? false),
  };
}

export async function fetchBooks() {
  const books = await request('/books');

  if (!Array.isArray(books)) {
    throw new Error('Books API returned an unexpected response.');
  }

  return books.map(normalizeBook);
}

export async function updateBookStarred(id, starred) {
  const updatedBook = await request(`/books/${encodeURIComponent(id)}/star`, {
    method: 'PATCH',
    body: JSON.stringify({ starred }),
  });

  return normalizeBook(updatedBook);
}

export { BOOKS_API_BASE_URL };
