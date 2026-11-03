const TOKEN_KEY = 'todoAuthToken';
const API_BASE_URL = '';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new ApiError('The server returned an invalid response.', response.status);
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await globalThis.fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }

    throw new ApiError(payload?.error || 'Request failed. Please try again.', response.status, payload?.details);
  }

  return payload;
}

export async function login(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: credentials,
  });
}

export async function getTodos(token = getStoredToken()) {
  return request('/todos', { token });
}

export async function createTodo(title, token = getStoredToken()) {
  return request('/todos', {
    method: 'POST',
    body: { title },
    token,
  });
}

export async function updateTodo(id, data, token = getStoredToken()) {
  return request(`/todos/${id}`, {
    method: 'PATCH',
    body: data,
    token,
  });
}

export async function completeAllTodos(token = getStoredToken()) {
  return request('/todos/complete-all', {
    method: 'PATCH',
    token,
  });
}
