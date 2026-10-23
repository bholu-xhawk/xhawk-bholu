import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
  it('renders Home link in navigation and Home heading by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Home/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('navigates to the demo product page and renders the carousel with the first slide selected', () => {
    renderApp();

    fireEvent.click(screen.getByRole('link', { name: /^Product$/i }));

    expect(screen.getByRole('heading', { name: /Trailhead Everyday Pack/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Demo product images/i })).toBeInTheDocument();
    expect(screen.getByText(/Image 1 of 3: Graphite daypack front view/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show product image 1/i })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });
});
