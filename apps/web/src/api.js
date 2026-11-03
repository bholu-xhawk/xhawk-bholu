const TOKEN_KEY = 'todo.authToken';
const API_BASE_URL = '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, token = getToken() } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) clearToken();
    throw new ApiError(payload?.error || 'Request failed', response.status);
  }

  return payload;
}

export async function login({ email, password }) {
  const payload = await request('/auth/login', { method: 'POST', body: { email, password }, token: null });
  setToken(payload.token);
  return payload;
}

export function listTodos() {
  return request('/todos');
}

export function createTodo(title) {
  return request('/todos', { method: 'POST', body: { title } });
}

export function updateTodo(id, updates) {
  return request(`/todos/${id}`, { method: 'PATCH', body: updates });
}

export function completeAllTodos() {
  return request('/todos/complete-all', { method: 'PATCH' });
}
