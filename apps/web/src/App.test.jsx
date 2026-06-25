import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

describe('App', () => {
  it('renders Home link in navigation and Home heading by default', () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true }}>
        <App />
      </BrowserRouter>
    );

	    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
	    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
	  });
});
