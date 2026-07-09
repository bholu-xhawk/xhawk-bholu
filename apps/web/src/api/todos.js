const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function handle(res) {
  if (!res.ok) {
    let info;
    try { info = await res.json(); } catch {}
    const err = new Error(info?.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.info = info;
    throw err;
  }
  const ct = res.headers.get('content-type') || '';
  if (res.status === 204 || !ct.includes('application/json')) return;
  return res.json();
}

export async function listTodos() {
  const res = await fetch(`${BASE}/todos`);
  return handle(res);
}

export async function addTodo(text) {
  const res = await fetch(`${BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return handle(res);
}

export async function updateTodo(id, patch) {
  const res = await fetch(`${BASE}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return handle(res);
}

export async function deleteTodo(id) {
  const res = await fetch(`${BASE}/todos/${id}`, { method: 'DELETE' });
  await handle(res);
}
