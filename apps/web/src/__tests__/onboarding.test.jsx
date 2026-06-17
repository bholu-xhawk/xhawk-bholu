import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App.jsx';
import { ONBOARDING_KEY } from '../lib/onboarding.js';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Onboarding flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('redirects first-time visitors to /welcome and shows Welcome content', async () => {
    renderWithRouter(<App />);

    expect(await screen.findByRole('heading', { name: /Welcome/i })).toBeInTheDocument();
  });

  it('finishing onboarding sets localStorage and navigates to Home', async () => {
    renderWithRouter(<App />);

    // Arrives on welcome
    expect(await screen.findByRole('heading', { name: /Welcome/i })).toBeInTheDocument();

    // Step 1 -> Continue
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    // Step 2 choose theme and Next
    fireEvent.click(screen.getByRole('button', { name: /Light/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 3 Finish
    fireEvent.click(screen.getByRole('button', { name: /Finish/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem(ONBOARDING_KEY)).toBe('true');
      expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
    });
  });

  it('with onboardingComplete set, goes straight to Home and not Welcome', () => {
    window.localStorage.setItem(ONBOARDING_KEY, 'true');

    renderWithRouter(<App />);

    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Welcome/i })).not.toBeInTheDocument();
  });
});
