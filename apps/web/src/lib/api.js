export const TOKEN_STORAGE_KEY = 'todo.authToken';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function sessionExpired(onUnauthorized) {
  clearStoredToken();
  if (onUnauthorized) {
    onUnauthorized();
  } else {
    window.dispatchEvent(new Event('todo-session-expired'));
  }
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

export async function apiRequest(path, { method = 'GET', body, token, onUnauthorized } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await readBody(response);

  if (response.status === 401) {
    sessionExpired(onUnauthorized);
  }

  if (!response.ok) {
    const message = data && typeof data === 'object' && data.error ? data.error : 'Request failed';
    throw new ApiError(message, response.status, data);
  }

  return data;
}
