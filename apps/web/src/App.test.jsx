import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

beforeEach(() => {
  window.localStorage.clear();
});

describe('App', () => {
  it('renders Home link in navigation and the to-do heading by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /To-do list/i })
    ).toBeInTheDocument();
  });
});
