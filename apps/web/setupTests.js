import '@testing-library/jest-dom';

// Provide a basic fetch mock for tests that render components calling fetch
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] }));
}

