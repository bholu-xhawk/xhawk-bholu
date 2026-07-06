import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  it('renders Home link in navigation and Home heading by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Assert the Home link in the navigation exists
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    // Assert the Home page heading exists
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });
});

