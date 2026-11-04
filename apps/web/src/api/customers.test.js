import { createCustomer, getCustomer, updateCustomer } from './customers.js';

describe('customer API client', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 'customer-1' }),
    });
  });

  afterEach(() => {
    delete globalThis.fetch;
  });

  it('reads one customer by id with an abort signal', async () => {
    const controller = new AbortController();

    await getCustomer('customer 1', { signal: controller.signal });

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers/customer%201', {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
      signal: controller.signal,
    });
  });

  it('creates customers with JSON payloads', async () => {
    const payload = { name: 'Ada Lovelace', email: 'ada@example.com', company: 'Example Inc' };

    await createCustomer(payload);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify(payload),
    });
  });

  it('updates customers with PATCH JSON payloads', async () => {
    const payload = { name: 'Grace Hopper', email: 'grace@example.com', company: 'Navy' };

    await updateCustomer('customer-1', payload);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers/customer-1', {
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  });

  it('throws parsed API error messages', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({ message: 'Email is invalid' }),
    });

    await expect(createCustomer({ name: 'Ada', email: 'bad', company: 'Example' })).rejects.toThrow(
      'Email is invalid'
    );
  });
});
