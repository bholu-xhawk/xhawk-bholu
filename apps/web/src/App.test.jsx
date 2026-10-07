import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

function renderApp(initialEntry = '/') {
  render(
    <MemoryRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      initialEntries={[initialEntry]}
    >
      <App />
    </MemoryRouter>
  );
}

describe('App', () => {
  it('renders Home link in navigation and Home heading by default', () => {
    renderApp();

    const headerNavigation = screen.getAllByRole('navigation')[0];
    expect(
      within(headerNavigation).getByRole('link', { name: 'Home' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it.each([
    { path: '/', heading: 'Home' },
    { path: '/about', heading: 'About' },
  ])('renders the shared footer on $path', ({ path, heading }) => {
    renderApp(path);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();

    const footer = screen.getByRole('contentinfo');
    const footerNavigation = within(footer).getByRole('navigation', {
      name: /footer navigation/i,
    });
    const currentYear = new Date().getFullYear().toString();

    expect(
      within(footer).getByText(new RegExp(`© ${currentYear} xhawk-bholu`))
    ).toBeInTheDocument();
    expect(
      within(footerNavigation).getByRole('link', { name: 'Home' })
    ).toHaveAttribute('href', '/');
    expect(
      within(footerNavigation).getByRole('link', { name: 'About' })
    ).toHaveAttribute('href', '/about');
  });
});
