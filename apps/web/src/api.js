const TOKEN_KEY = 'todo.jwt';
const API_BASE_URL = '';

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function hasToken() {
  return Boolean(getToken());
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
}

export async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await readJson(response);

  if (!response.ok) {
    if (response.status === 401) clearToken();
    const message = data?.error || data?.message || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
}

export function signup({ email, password }) {
  return apiRequest('/api/auth/signup', {
    method: 'POST',
    body: { email, password },
  });
}

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  if (data?.token) saveToken(data.token);
  return data;
}

export function listTodos() {
  return apiRequest('/api/todos');
}

export function createTodo(title) {
  return apiRequest('/api/todos', {
    method: 'POST',
    body: { title },
  });
}

export function updateTodo(id, fields) {
  return apiRequest(`/api/todos/${id}`, {
    method: 'PATCH',
    body: fields,
  });
}

export function completeAllTodos() {
  return apiRequest('/api/todos/complete-all', {
    method: 'PATCH',
  });
}
