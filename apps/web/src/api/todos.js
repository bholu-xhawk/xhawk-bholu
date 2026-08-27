const DEFAULT_API_BASE_URL = 'http://localhost:3001/api';

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  return DEFAULT_API_BASE_URL;
}

function buildUrl(path) {
  return `${getApiBaseUrl().replace(/\/$/, '')}${path}`;
}

function getAuthToken() {
  if (typeof window === 'undefined') return '';

  if (window.__AUTH_TOKEN__) return window.__AUTH_TOKEN__;

  try {
    return window.localStorage?.getItem('authToken') || '';
  } catch {
    return '';
  }
}

async function parseResponse(response) {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await parseResponse(response);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && body.error
        ? body.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export function listTodos() {
  return request('/todos');
}

export function createTodo(title) {
  return request('/todos', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function updateTodoCompleted(id, completed) {
  return request(`/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

export function deleteTodo(id) {
  return request(`/todos/${id}`, {
    method: 'DELETE',
  });
}
