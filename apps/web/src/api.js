const SESSION_KEY = 'todo-session-token';
const API_BASE_URL = globalThis.process?.env?.VITE_API_URL || '/api';

let unauthorizedHandler = null;

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getStoredToken() {
  try {
    return window.localStorage.getItem(SESSION_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredToken(token) {
  window.localStorage.setItem(SESSION_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiRequest(path, { method = 'GET', body, token = getStoredToken(), headers = {} } = {}) {
  const requestHeaders = { ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const message = payload?.error || `Request failed with status ${response.status}`;
    const error = new ApiError(message, response.status, payload);
    if (response.status === 401 && unauthorizedHandler) unauthorizedHandler(error);
    throw error;
  }

  return payload;
}

export async function login(email, password) {
  const payload = await apiRequest('/auth/login', { method: 'POST', body: { email, password }, token: '' });
  setStoredToken(payload.token);
  return payload.token;
}

export async function signup({ email, password, name }) {
  await apiRequest('/auth/signup', {
    method: 'POST',
    body: { email, password, ...(name ? { name } : {}) },
    token: '',
  });
  return login(email, password);
}
