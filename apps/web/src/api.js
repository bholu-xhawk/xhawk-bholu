const TOKEN_KEY = 'workspace.todoToken';
let unauthorizedHandler = null;

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error || 'Request failed';
    if (response.status === 401) {
      clearToken();
      if (unauthorizedHandler) unauthorizedHandler();
    }
    throw new ApiError(message, { status: response.status, details: payload?.details });
  }

  return payload;
}

export async function login(credentials) {
  return apiRequest('/auth/login', { method: 'POST', body: credentials, auth: false });
}

export async function signup(account) {
  return apiRequest('/auth/signup', { method: 'POST', body: account, auth: false });
}

export async function listTodos() {
  return apiRequest('/todos');
}

export async function createTodo(title) {
  return apiRequest('/todos', { method: 'POST', body: { title } });
}

export async function updateTodo(id, updates) {
  return apiRequest(`/todos/${id}`, { method: 'PUT', body: updates });
}

export async function completeAllTodos() {
  return apiRequest('/todos/complete-all', { method: 'PUT' });
}
