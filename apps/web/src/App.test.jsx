import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { fetchBooks } from './api/books.js';

jest.mock('./api/books.js', () => ({
  fetchBooks: jest.fn(),
  updateBookStarred: jest.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    fetchBooks.mockResolvedValue([]);
  });

  it('renders Home link in navigation and Books heading by default', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /Books/i })
    ).toBeInTheDocument();
  });
});
