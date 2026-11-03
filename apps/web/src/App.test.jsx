import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

jest.mock('./pages/Todos.jsx', () => function MockTodos() {
  return <h1>Todos</h1>;
});

function renderApp(initialPath = '/') {
  window.history.pushState({}, '', initialPath);
  render(
    <MemoryRouter initialEntries={[initialPath]}>
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

  it('shows unauthenticated navigation and auth route', () => {
    renderApp('/auth');

    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });

  it('redirects visitors without a token away from todos', () => {
    renderApp('/todos');

    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^todos$/i })).not.toBeInTheDocument();
  });

  it('renders the authenticated todo route', () => {
    window.localStorage.setItem('todo.jwt', 'jwt');
    renderApp('/todos');

    expect(screen.getByRole('heading', { name: /^todos$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('logs out and clears stored credentials', () => {
    window.localStorage.setItem('todo.jwt', 'jwt');
    renderApp('/todos');

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(window.localStorage.getItem('todo.jwt')).toBeNull();
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });
});
