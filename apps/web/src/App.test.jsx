import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { TOKEN_STORAGE_KEY } from './lib/api.js';

function renderApp(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders Home link in navigation and Home heading by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('guards the todos route when no token is stored', () => {
    renderApp(['/todos']);

    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows todo navigation for signed-in users and logs out', () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'saved-token');
    globalThis.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('[]') }));

    renderApp(['/']);

    expect(screen.getByRole('link', { name: /todos/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });
});
