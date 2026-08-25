const DEFAULT_BOOKS_API_URL = 'http://127.0.0.1:3000';

function getBooksApiBaseUrl() {
  return (import.meta.env.VITE_BOOKS_API_URL || DEFAULT_BOOKS_API_URL).replace(
    /\/+$/,
    ''
  );
}

async function parseResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Books API returned invalid JSON: ${error.message}`);
  }
}

async function requestJson(path, options = {}) {
  const { headers, ...fetchOptions } = options;
  const response = await fetch(`${getBooksApiBaseUrl()}${path}`, {
    ...fetchOptions,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      body?.error ||
      body?.message ||
      `Books API request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export function fetchBooks() {
  return requestJson('/books');
}

export function updateBookStarred(bookId, starred) {
  return requestJson(`/books/${bookId}/starred`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ starred }),
  });
}
