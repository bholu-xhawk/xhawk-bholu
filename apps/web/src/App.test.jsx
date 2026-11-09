import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders Todos link in navigation and Todo experience by default', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Todos/i })).toBeInTheDocument();
    expect(await screen.findByText(/No todos yet/i)).toBeInTheDocument();
  });
});
