const API_BASE_URL = '/api';
const TOKEN_STORAGE_KEY = 'token';

export class CustomerApiError extends Error {
  constructor(message, { status, fieldErrors, body } = {}) {
    super(message);
    this.name = 'CustomerApiError';
    this.status = status;
    this.fieldErrors = fieldErrors || {};
    this.body = body;
  }
}

function authHeaders() {
  const token = window.localStorage?.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function customerPayload(customer) {
  return {
    name: customer.name,
    email: customer.email,
    company: customer.company,
  };
}

function normalizeFieldErrors(details) {
  const source = details?.fieldErrors || details?.field_errors || details?.errors || details;
  if (!source || typeof source !== 'object') return {};

  return Object.entries(source).reduce((errors, [field, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      errors[field] = String(value[0]);
    } else if (typeof value === 'string' && value) {
      errors[field] = value;
    }
    return errors;
  }, {});
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    return { error: text };
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const body = await parseJson(response);

  if (!response.ok) {
    throw new CustomerApiError(body?.error || 'Customer request failed', {
      status: response.status,
      fieldErrors: normalizeFieldErrors(body?.details || body?.fieldErrors || body?.errors),
      body,
    });
  }

  return body;
}

export function getCustomer(id) {
  return request(`/customers/${encodeURIComponent(id)}`);
}

export function createCustomer(customer) {
  return request('/customers', {
    method: 'POST',
    body: JSON.stringify(customerPayload(customer)),
  });
}

export function updateCustomer(id, customer) {
  return request(`/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(customerPayload(customer)),
  });
}
