import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

beforeEach(() => {
  globalThis.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } }) }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('App', () => {
  it('renders Home, About, and Customers links in navigation and Home heading by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Customers/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('routes /customers to the customer directory page', async () => {
    render(
      <MemoryRouter initialEntries={['/customers']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Customers/i })).toBeInTheDocument();
    expect(await screen.findByText(/No customers have been added yet/i)).toBeInTheDocument();
  });
});
