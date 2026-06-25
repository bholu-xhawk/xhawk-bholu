import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';

describe('Navigation', () => {
  it('shows nav links and navigates to About on click', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Links present
    const homeLink = screen.getByRole('link', { name: /Home/i });
    const aboutLink = screen.getByRole('link', { name: /About/i });
    expect(homeLink).toBeInTheDocument();
    expect(aboutLink).toBeInTheDocument();

    // UL has list reset and alignment classes
    const list = homeLink.closest('ul');
    expect(list).toHaveClass('list-none');
    expect(list).toHaveClass('m-0');
    expect(list).toHaveClass('p-0');
    expect(list).toHaveClass('items-center');

    // Default route shows Home
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();

    // Navigate to About
    fireEvent.click(aboutLink);

    // About heading renders
    expect(screen.getByRole('heading', { name: /About/i })).toBeInTheDocument();
  });
});
