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

    // Ensure the Home nav link is present
    expect(screen.getByRole('link', { name: /^Home$/i })).toBeInTheDocument();
    // And the Home page heading renders by default
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });
});

