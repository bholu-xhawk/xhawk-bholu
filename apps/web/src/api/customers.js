async function parseResponse(response) {
  let body = null;

  try {
    body = await response.json();
  } catch (error) {
    body = null;
  }

  if (!response.ok) {
    const message = body?.error || body?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  return parseResponse(response);
}

export function getCustomer(id, options = {}) {
  return request(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'GET',
    signal: options.signal,
  });
}

export function createCustomer(customer) {
  return request('/api/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
}

export function updateCustomer(id, customer) {
  return request(`/api/customers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(customer),
  });
}
