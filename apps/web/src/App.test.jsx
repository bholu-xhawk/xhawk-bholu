import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
  });

  it('renders app navigation and Home heading by default', () => {
    render(
      <BrowserRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute(
      'href',
      '/about'
    );
    expect(screen.getByRole('link', { name: /todos/i })).toHaveAttribute(
      'href',
      '/todos'
    );
    expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument();
  });

  it('renders the Todos page at /todos', () => {
    window.history.pushState({}, '', '/todos');

    render(
      <BrowserRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <App />
      </BrowserRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /^todos$/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/new todo/i)).toBeInTheDocument();
  });
});
