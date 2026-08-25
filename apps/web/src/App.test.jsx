import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  it('renders Home link in navigation and the todo page by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Todo App/i })).toBeInTheDocument();
    expect(screen.getByText(/Review project requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/Build the todo interface/i)).toBeInTheDocument();
  });
});
