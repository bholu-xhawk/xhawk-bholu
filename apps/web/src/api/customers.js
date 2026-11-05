const CUSTOMER_FIELDS = ['name', 'email', 'company'];

function customerPath(id) {
  return `/api/customers/${encodeURIComponent(id)}`;
}

function customerPayload(values) {
  return CUSTOMER_FIELDS.reduce((payload, field) => {
    payload[field] = String(values[field] ?? '').trim();
    return payload;
  }, {});
}

async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.error || `Customer request failed with status ${response.status}`
    );
  }

  return body;
}

export async function getCustomer(id) {
  const response = await fetch(customerPath(id));
  return parseResponse(response);
}

export async function createCustomer(values) {
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerPayload(values)),
  });
  return parseResponse(response);
}

export async function updateCustomer(id, values) {
  const response = await fetch(customerPath(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerPayload(values)),
  });
  return parseResponse(response);
}
