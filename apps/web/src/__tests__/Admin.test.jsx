import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';

beforeEach(() => {
  // Set a test token to simulate authenticated session
  window.localStorage.setItem('authToken', 'test-token-123456');
  global.fetch = jest.fn(async (url, options) => {
    const u = typeof url === 'string' ? url : url.url || '';
    if (u.includes('/api/users')) {
      // Verify Authorization header is present when token exists
      const auth = options?.headers?.Authorization || options?.headers?.authorization;
      if (!auth || !String(auth).includes('Bearer test-token-')) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' }),
          text: async () => JSON.stringify({ error: 'Unauthorized' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ([
          { id: 1, email: 'alice@example.com', name: 'Alice', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
          { id: 2, email: 'bob@example.com', name: 'Bob', createdAt: '2024-01-02T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
        ]),
      };
    }
    if (u.includes('/api/health')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      };
    }
    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' }),
      text: async () => 'Not found',
    };
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

it('shows Admin link and navigates to Users', async () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  const adminLink = screen.getByText('Admin');
  expect(adminLink).toBeInTheDocument();
  fireEvent.click(adminLink);
  // Expect users table to appear with mocked data
  await waitFor(() => expect(screen.getByText('alice@example.com')).toBeInTheDocument());
  expect(screen.getByText('bob@example.com')).toBeInTheDocument();
});

it('Monitoring refresh shows ok status and latency', async () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // Navigate to monitoring via admin nav inside Admin layout
  fireEvent.click(screen.getByText('Admin'));
  const monitoringTab = await screen.findByText('Monitoring');
  fireEvent.click(monitoringTab);
  const refreshBtn = await screen.findByText('Refresh');
  const t0 = performance.now();
  fireEvent.click(refreshBtn);
  // Wait until status text updates to ok
  await screen.findByText(/Status: ok/i);
  // Latency should render
  const latencyEl = screen.getByText(/Latency:/);
  const t1 = performance.now();
  // approximate check that latency computed and displayed
  expect(latencyEl.textContent).toMatch(/ms/);
  expect(t1 - t0).toBeGreaterThan(0);
});
