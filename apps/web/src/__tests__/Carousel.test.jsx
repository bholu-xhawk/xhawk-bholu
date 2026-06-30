import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Carousel from '../components/Carousel';

const mockImages = [
  { id: 1, url: 'https://example.com/1.jpg', title: 'One', alt: 'One' },
  { id: 2, url: 'https://example.com/2.jpg', title: 'Two', alt: 'Two' },
  { id: 3, url: 'https://example.com/3.jpg', title: 'Three', alt: 'Three' },
];

describe('Carousel', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => mockImages }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('navigates through images with Next and Prev', async () => {
    render(<Carousel />);

    // Wait for first image title to appear
    await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument());

    // Next -> should show Two
    fireEvent.click(screen.getByRole('button', { name: /Next slide/i }));
    await waitFor(() => expect(screen.getByText('Two')).toBeInTheDocument());

    // Next -> should show Three
    fireEvent.click(screen.getByRole('button', { name: /Next slide/i }));
    await waitFor(() => expect(screen.getByText('Three')).toBeInTheDocument());

    // Next -> wrap to One
    fireEvent.click(screen.getByRole('button', { name: /Next slide/i }));
    await waitFor(() => expect(screen.getByText('One')).toBeInTheDocument());

    // Prev -> wrap to Three
    fireEvent.click(screen.getByRole('button', { name: /Previous slide/i }));
    await waitFor(() => expect(screen.getByText('Three')).toBeInTheDocument());
  });
});
