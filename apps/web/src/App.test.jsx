import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  it('renders Home link in navigation and the album heading by default', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /browse a living photo album/i })
    ).toBeInTheDocument();
  });
});
