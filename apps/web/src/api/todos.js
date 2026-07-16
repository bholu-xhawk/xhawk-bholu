const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}`);
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

export function updateTodo(id, updates) {
  return request(`/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function deleteTodo(id) {
  return request(`/todos/${id}`, { method: 'DELETE' });
}
