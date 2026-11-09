const SORT_FIELDS = new Set(['name', 'email', 'company', 'status', 'createdAt']);
const SORT_DIRECTIONS = new Set(['asc', 'desc']);

export class CustomerApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CustomerApiError';
    this.status = status;
  }
}

function appendSupportedParam(params, key, value) {
  if (value === undefined || value === null || value === '') return;
  params.set(key, String(value));
}

function assertCustomerResponse(payload) {
  if (
    !payload ||
    !Array.isArray(payload.customers) ||
    !payload.pagination ||
    typeof payload.pagination.page !== 'number' ||
    typeof payload.pagination.pageSize !== 'number' ||
    typeof payload.pagination.total !== 'number' ||
    typeof payload.pagination.totalPages !== 'number'
  ) {
    throw new CustomerApiError('Unexpected customers response');
  }

  return payload;
}

export async function listCustomers({ search, page, sortBy, sortDirection, signal } = {}) {
  const params = new URLSearchParams();
  appendSupportedParam(params, 'search', search?.trim());
  if (Number.isInteger(page) && page > 0) appendSupportedParam(params, 'page', page);
  if (SORT_FIELDS.has(sortBy)) appendSupportedParam(params, 'sortBy', sortBy);
  if (SORT_DIRECTIONS.has(sortDirection)) appendSupportedParam(params, 'sortDirection', sortDirection);

  const query = params.toString();
  const response = await fetch(`/api/customers${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    signal,
  });

  let payload;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload && typeof payload.error === 'string' ? payload.error : 'Failed to load customers';
    throw new CustomerApiError(message, response.status);
  }

  return assertCustomerResponse(payload);
}
