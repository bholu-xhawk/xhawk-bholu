import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  it('renders Home link in navigation and product carousel showcase by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Explore products built for everyday momentum/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /Product image carousel/i })
    ).toBeInTheDocument();
  });
});
