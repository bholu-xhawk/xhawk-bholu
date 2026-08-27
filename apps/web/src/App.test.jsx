import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

function mockJsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe('App', () => {
  beforeEach(() => {
    window.fetch = jest.fn(() => mockJsonResponse([]));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Home link in navigation and Todos heading by default', async () => {
    render(
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Todos/i })
    ).toBeInTheDocument();
  });
});
