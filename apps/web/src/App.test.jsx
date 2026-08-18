import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

function renderApp(path = '/') {
  window.history.pushState({}, '', path);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete globalThis.fetch;
    window.history.pushState({}, '', '/');
  });

  it('renders Home, About, and Booklist links in navigation and Home heading by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /About/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /Booklist/i })).toHaveAttribute('href', '/booklist');
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('wires the /booklist route to the booklist page', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderApp('/booklist');

    expect(await screen.findByRole('heading', { name: /Booklist/i })).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/booklist');
  });
});
