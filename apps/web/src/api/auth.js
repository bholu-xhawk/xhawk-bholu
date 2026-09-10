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

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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

export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signup(email, password) {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
