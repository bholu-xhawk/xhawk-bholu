import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

const accordionItems = [
  {
    id: 'backend-driven-content',
    title: 'Backend-driven content',
    description: 'Accordion titles and descriptions are served by the Express API.',
  },
  {
    id: 'client-side-toggle',
    title: 'Client-side toggle state',
    description: 'React keeps track of which accordion panels are currently open.',
  },
];

function renderApp() {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => accordionItems,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Home link in navigation and Home heading by default', async () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Backend-driven content/i })).toBeInTheDocument();
  });

  it('fetches backend accordion items and toggles descriptions', async () => {
    renderApp();

    expect(global.fetch).toHaveBeenCalledWith('/api/accordion');

    const firstTitle = await screen.findByRole('button', { name: /Backend-driven content/i });
    expect(screen.getByRole('button', { name: /Client-side toggle state/i })).toBeInTheDocument();
    expect(screen.queryByText('Accordion titles and descriptions are served by the Express API.')).not.toBeInTheDocument();
    expect(firstTitle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(firstTitle);

    expect(screen.getByText('Accordion titles and descriptions are served by the Express API.')).toBeInTheDocument();
    expect(firstTitle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(firstTitle);

    expect(screen.queryByText('Accordion titles and descriptions are served by the Express API.')).not.toBeInTheDocument();
    expect(firstTitle).toHaveAttribute('aria-expanded', 'false');
  });
});
