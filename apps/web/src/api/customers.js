const API_BASE = '/api';

function getAuthToken() {
  return window.localStorage.getItem('authToken') || window.localStorage.getItem('token');
}

export async function listCustomers({ search = '', sort = 'signedUpAt', direction = 'desc', page = 1, signal } = {}) {
  const params = new URLSearchParams({
    search,
    sort,
    direction,
    page: String(page),
  });
  const headers = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/customers?${params.toString()}`, { headers, signal });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || 'Unable to load customers.');
  }

  return body;
}
