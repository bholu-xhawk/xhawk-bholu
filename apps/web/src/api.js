export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.unauthorized = status === 401;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(data?.error || 'Request failed', response.status, data?.details);
  }

  return data;
}

export function signup({ email, password, name }) {
  return request('/auth/signup', { method: 'POST', body: { email, password, name: name || undefined } });
}

export function login({ email, password }) {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

export function listTodos(token) {
  return request('/todos', { token });
}

export function createTodo(token, title) {
  return request('/todos', { method: 'POST', token, body: { title } });
}

export function updateTodo(token, id, updates) {
  return request(`/todos/${id}`, { method: 'PATCH', token, body: updates });
}

export function deleteTodo(token, id) {
  return request(`/todos/${id}`, { method: 'DELETE', token });
}
