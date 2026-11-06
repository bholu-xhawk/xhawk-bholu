const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function listCustomers({ search = '', sort = 'signedUpAt', direction = 'desc', page = 1, token, signal } = {}) {
  const params = new URLSearchParams({
    search,
    sort,
    direction,
    page: String(page),
  });
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/customers?${params.toString()}`, { headers, signal });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.error || 'Unable to load customers.');
    error.status = response.status;
    throw error;
  }

  return body;
}
