/*
 * Stubbed Admin API client for the web app.
 *
 * This module intentionally isolates the API surface so it can be swapped
 * to a real network client when backend role support and client auth exist.
 *
 * To replace with a real implementation in the future:
 * - Export the same `createAdmin(payload[, options])` function below.
 * - Use `fetch` (or your HTTP client of choice) to call a backend endpoint
 *   such as POST /api/admins or POST /api/users with role=admin.
 * - Thread an auth token when available, e.g.:
 *     fetch('/api/admins', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'Authorization': `Bearer ${token}`,
 *       },
 *       body: JSON.stringify(payload),
 *     })
 *
 * Keep the return value shape consistent where possible to avoid UI churn.
 */

/**
 * Simulate network latency.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an admin user (stubbed).
 *
 * @param {{ email: string, name?: string|null, password: string }} payload
 * @returns {Promise<{ id: string, email: string, name: string|null, role: 'admin', createdAt: string }>}
 */
export async function createAdmin(payload) {
  const { email, name = null, password } = payload || {};

  // Minimal client-side sanity; the page performs validation but guard here too.
  if (!email || !password) {
    throw new Error('Missing required fields');
  }

  // Simulate network latency
  await delay(400);

  // Deterministic failure hooks to exercise error paths during tests/manual QA
  const shouldFail =
    (typeof email === 'string' && email.toLowerCase().includes('fail')) ||
    password === 'rejectme';

  if (shouldFail) {
    const err = new Error('Failed to create admin');
    err.code = 'CREATE_ADMIN_FAILED';
    throw err;
  }

  // Synthesize an id and echo key fields
  const idSuffix = Math.random().toString(36).slice(2, 8);
  const response = {
    id: `adm_${Date.now().toString(36)}_${idSuffix}`,
    email,
    name: name ?? null,
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  return response;
}
