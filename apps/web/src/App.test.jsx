import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

function mockJsonResponse(body, init = {}) {
  return Promise.resolve({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

describe('App', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('renders Home link in navigation and Home heading by default', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('routes to the book detail page', async () => {
    global.fetch = jest.fn(() =>
      mockJsonResponse({ id: 7, title: 'Kindred', author: 'Octavia E. Butler', publishedYear: 1979 })
    );

    render(
      <MemoryRouter initialEntries={['/books/7']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Kindred/i })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/books/7', expect.any(Object));
  });

  it('routes to the book edit page', async () => {
    global.fetch = jest.fn(() =>
      mockJsonResponse({ id: 7, title: 'Kindred', author: 'Octavia E. Butler', publishedYear: 1979 })
    );

    render(
      <MemoryRouter initialEntries={['/books/7/edit']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Edit book/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toHaveValue('Kindred');
  });
});
