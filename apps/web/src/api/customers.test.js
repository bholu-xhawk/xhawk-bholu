import { createCustomer, getCustomer, updateCustomer } from './customers.js';

function mockJsonResponse(body, options = {}) {
  return Promise.resolve({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: () => Promise.resolve(body),
  });
}

describe('customer API client', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete globalThis.fetch;
  });

  it('loads one customer by id', async () => {
    const customer = {
      _id: 'abc123',
      name: 'Ada',
      email: 'ada@example.com',
      company: 'Lovelace Labs',
    };
    globalThis.fetch.mockResolvedValueOnce(await mockJsonResponse(customer));

    await expect(getCustomer('abc123')).resolves.toEqual(customer);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers/abc123');
  });

  it('creates a customer with trimmed JSON body', async () => {
    const created = {
      _id: 'new-id',
      name: 'Grace',
      email: 'grace@example.com',
      company: 'Compiler Co',
    };
    globalThis.fetch.mockResolvedValueOnce(
      await mockJsonResponse(created, { status: 201 })
    );

    await expect(
      createCustomer({
        name: '  Grace  ',
        email: ' grace@example.com ',
        company: ' Compiler Co ',
      })
    ).resolves.toEqual(created);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Grace',
        email: 'grace@example.com',
        company: 'Compiler Co',
      }),
    });
  });

  it('updates a customer with PATCH and trimmed JSON body', async () => {
    const updated = {
      _id: 'abc123',
      name: 'Katherine',
      email: 'kat@example.com',
      company: 'NASA',
    };
    globalThis.fetch.mockResolvedValueOnce(await mockJsonResponse(updated));

    await expect(
      updateCustomer('abc123', {
        name: ' Katherine ',
        email: ' kat@example.com ',
        company: ' NASA ',
      })
    ).resolves.toEqual(updated);

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/customers/abc123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Katherine',
        email: 'kat@example.com',
        company: 'NASA',
      }),
    });
  });

  it('throws the API error message when a request fails', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      await mockJsonResponse(
        { error: 'Customer not found' },
        { ok: false, status: 404 }
      )
    );

    await expect(getCustomer('missing')).rejects.toThrow('Customer not found');
  });
});
