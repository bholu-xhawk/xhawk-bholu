import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ImageCarousel from './ImageCarousel.jsx';

const images = [
  { src: '/front.png', alt: 'Blue backpack front view' },
  { src: '/side.png', alt: 'Blue backpack side pocket detail' },
  { src: '/inside.png', alt: 'Blue backpack interior organizer view' },
];

function renderCarousel(props = {}) {
  render(<ImageCarousel images={images} {...props} />);

  return screen.getByRole('region', { name: 'Product images' });
}

function expectCurrentSlide(index) {
  expect(
    screen.getByText(
      `${images[index].alt} — slide ${index + 1} of ${images.length}`
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: images[index].alt })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: `Go to slide ${index + 1}` })
  ).toHaveAttribute('aria-current', 'true');
  expect(screen.getByTestId('image-carousel-track')).toHaveStyle({
    transform: `translateX(-${index * 100}%)`,
  });
}

describe('ImageCarousel', () => {
  it('renders the initial slide, accessible controls, position indicators, and alt text', () => {
    const region = renderCarousel();

    expect(region).toHaveAttribute('tabIndex', '0');
    expect(
      screen.getByRole('button', { name: 'Previous slide' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next slide' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Choose product image' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Go to slide 1' })
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('button', { name: 'Go to slide 2' })
    ).not.toHaveAttribute('aria-current');
    expectCurrentSlide(0);
  });

  it('moves to the next and previous slides with wraparound controls', () => {
    renderCarousel();

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expectCurrentSlide(1);

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expectCurrentSlide(2);

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expectCurrentSlide(0);

    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expectCurrentSlide(2);
  });

  it('jumps directly to a selected slide with indicator buttons', () => {
    renderCarousel();

    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));

    expectCurrentSlide(2);
    expect(
      screen.getByRole('button', { name: 'Go to slide 1' })
    ).not.toHaveAttribute('aria-current');
  });

  it('supports Left and Right keyboard navigation on the carousel region', () => {
    const region = renderCarousel();

    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expectCurrentSlide(1);

    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expectCurrentSlide(0);

    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expectCurrentSlide(2);
  });

  it('renders safely without redundant controls for a single image', () => {
    render(<ImageCarousel images={[images[0]]} />);

    expect(
      screen.getByRole('region', { name: 'Product images' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: images[0].alt })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${images[0].alt} — slide 1 of 1`)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous slide' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next slide' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('group', { name: 'Choose product image' })
    ).not.toBeInTheDocument();
  });

  it('renders an accessible empty state without throwing', () => {
    render(<ImageCarousel images={[]} />);

    expect(
      screen.getByRole('region', { name: 'Product images' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('No product images are available.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous slide' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next slide' })
    ).not.toBeInTheDocument();
  });

  it('includes responsive clipping and reduced-motion classes', () => {
    const region = renderCarousel();
    const viewport = screen.getByTestId('image-carousel-viewport');
    const track = screen.getByTestId('image-carousel-track');
    const slide = within(viewport).getByRole('img', {
      name: images[0].alt,
    }).parentElement;

    expect(region).toHaveClass('w-full', 'max-w-4xl', 'overflow-hidden');
    expect(viewport).toHaveClass('w-full', 'overflow-hidden');
    expect(track).toHaveClass(
      'motion-safe:transition-transform',
      'motion-reduce:transition-none'
    );
    expect(slide).toHaveClass('w-full', 'min-w-0', 'flex-none', 'shrink-0');
  });
});
