const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:3001/api';

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export function fetchBook(id) {
  return request(`/books/${id}`);
}

export function updateBook(id, payload) {
  return request(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
