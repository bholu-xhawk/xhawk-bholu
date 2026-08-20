import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders navigation links and Home heading by default', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Booklist/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('wires the /booklist route into the app shell', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        sortBy: 'title',
        sortDirection: 'asc',
      }),
    });

    render(
      <MemoryRouter initialEntries={["/booklist"]}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Booklist/i })).toBeInTheDocument();
    expect(await screen.findByText('No books found.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/booklist'), expect.any(Object));
  });
});
