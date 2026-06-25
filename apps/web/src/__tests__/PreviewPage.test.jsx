import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import App from '../App.jsx';

describe('Preview page routing and nav', () => {
  test('renders Preview placeholder at /preview', () => {
    render(
      <MemoryRouter initialEntries={["/preview"]}>
        <App />
      </MemoryRouter>
    );

    // Heading should be "Preview"
    expect(screen.getByRole('heading', { name: /preview/i })).toBeInTheDocument();

    // Awaiting assets notice should be present
    expect(
      screen.getByText(/design pending: awaiting final image and copy/i)
    ).toBeInTheDocument();
  });

  test('nav contains Preview link to /preview', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /preview/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/preview');
  });
});
