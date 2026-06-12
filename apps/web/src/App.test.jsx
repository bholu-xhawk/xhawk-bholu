import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ONBOARDING_KEY } from './lib/onboarding.js';

describe('App', () => {
  it('renders Home link in navigation and Home heading when onboarding complete', () => {
    window.localStorage.setItem(ONBOARDING_KEY, 'true');
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/Home/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });
});

