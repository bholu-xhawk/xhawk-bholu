import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

const mockBooks = [
  { id: 1, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813 },
];

function renderApp() {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it('fetches and renders the Booklist table by default', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockBooks,
    });

    renderApp();

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Booklist/i })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/books');
    expect(await screen.findByRole('columnheader', { name: /Title/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Author/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Year/i })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Pride and Prejudice' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Jane Austen' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1813' })).toBeInTheDocument();
  });

  it('renders an error message when the book request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load the booklist/i
    );
  });
});
