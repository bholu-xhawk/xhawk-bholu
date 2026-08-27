import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

function renderApp() {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  it('renders Home link in navigation and the todo page by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Todo App/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Build the todo workflow/i)).toBeInTheDocument();
  });
});
