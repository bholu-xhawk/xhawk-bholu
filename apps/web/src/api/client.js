// Minimal API client helper for Admin UI
// Resolve API base without relying on import.meta for Jest compatibility
let API_BASE = '/api';
if (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) {
  API_BASE = process.env.VITE_API_BASE_URL || API_BASE;
}
export function getApiBase() {
  return API_BASE;
}

export function getToken() {
  try {
    return localStorage.getItem('authToken');
  } catch (e) {
    return null;
  }
}

function joinUrl(base, path) {
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`;
  return `${base}${path}`;
}

export async function apiFetch(path, options = {}) {
  const url = joinUrl(API_BASE, path);
  const headers = { ...(options.headers || {}) };

  // Attach Authorization if token exists and path is not under /auth/
  const token = getToken();
  const pathOnly = path.startsWith('/') ? path : `/${path}`;
  if (token && !pathOnly.startsWith('/auth/') && !pathOnly.startsWith('/health')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle JSON body
  const opts = { ...options, headers };
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    opts.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    let errorPayload;
    try {
      errorPayload = await res.json();
    } catch (e) {
      try {
        const text = await res.text();
        errorPayload = { error: text || 'Request failed' };
      } catch (e2) {
        errorPayload = { error: 'Request failed' };
      }
    }
    const err = new Error(errorPayload.error || 'Request failed');
    err.payload = errorPayload;
    err.status = res.status;
    throw err;
  }
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export const UsersAPI = {
  async list() {
    return apiFetch('/users', { method: 'GET' });
  },
  async create({ email, name, password }) {
    return apiFetch('/users', { method: 'POST', body: { email, name, password } });
  },
  async update(id, payload) {
    return apiFetch(`/users/${id}`, { method: 'PUT', body: payload });
  },
  async remove(id) {
    // DELETE typically returns 204 No Content; apiFetch will return null
    return apiFetch(`/users/${id}`, { method: 'DELETE' });
  },
};

export const HealthAPI = {
  async get() {
    return apiFetch('/health', { method: 'GET' });
  },
};
