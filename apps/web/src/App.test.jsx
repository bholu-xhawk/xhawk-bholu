import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

class MockIntersectionObserver {
  observe() {}
  disconnect() {}
}

describe('App', () => {
  beforeEach(() => {
    globalThis.IntersectionObserver = MockIntersectionObserver;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        images: [
          {
            id: 'app-test-photo',
            src: 'https://example.com/app-test-photo.jpg',
            width: 1200,
            height: 800,
            author: 'App Test',
            alt: 'Random photo by App Test',
          },
        ],
      }),
    });
  });

  afterEach(() => {
    delete globalThis.IntersectionObserver;
    delete globalThis.fetch;
  });

  it('renders Home link in navigation and Home heading by default', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Random photo by App Test' })).toBeInTheDocument();
  });
});
