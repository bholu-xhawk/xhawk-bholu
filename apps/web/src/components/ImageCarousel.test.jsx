import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ImageCarousel from './ImageCarousel.jsx';

const slides = [
  {
    id: 'alpha',
    title: 'Alpha pack',
    eyebrow: 'Travel',
    description: 'A compact travel pack.',
    alt: 'Alpha pack product image',
    src: 'alpha.svg',
  },
  {
    id: 'bravo',
    title: 'Bravo lamp',
    eyebrow: 'Desk',
    description: 'A focused desk lamp.',
    alt: 'Bravo lamp product image',
    src: 'bravo.svg',
  },
  {
    id: 'charlie',
    title: 'Charlie mug',
    eyebrow: 'Kitchen',
    description: 'An insulated mug.',
    alt: 'Charlie mug product image',
    src: 'charlie.svg',
  },
];

function renderCarousel() {
  render(<ImageCarousel label="Featured products" slides={slides} />);

  return {
    carousel: screen.getByRole('region', { name: 'Featured products' }),
    next: screen.getByRole('button', { name: 'Show next product image' }),
    previous: screen.getByRole('button', {
      name: 'Show previous product image',
    }),
    track: screen.getByTestId('carousel-track'),
    viewport: screen.getByTestId('carousel-viewport'),
  };
}

function expectActiveSlide(position) {
  expect(screen.getByTestId('carousel-track')).toHaveStyle({
    transform: `translateX(-${position * 100}%)`,
  });
  expect(
    screen.getByRole('button', {
      name: `Show slide ${position + 1}: ${slides[position].title}`,
    })
  ).toHaveAttribute('aria-current', 'true');
}

describe('ImageCarousel', () => {
  it('advances with the next button and updates active-position semantics', () => {
    const { next } = renderCarousel();

    fireEvent.click(next);

    expectActiveSlide(1);
    expect(
      screen.getByRole('button', { name: 'Show slide 1: Alpha pack' })
    ).not.toHaveAttribute('aria-current');
  });

  it('moves backward with the previous button', () => {
    const { next, previous } = renderCarousel();

    fireEvent.click(next);
    fireEvent.click(previous);

    expectActiveSlide(0);
  });

  it('wraps from the final slide back to the first slide', () => {
    const { next } = renderCarousel();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show slide 3: Charlie mug' })
    );
    fireEvent.click(next);

    expectActiveSlide(0);
  });

  it('wraps from the first slide back to the final slide', () => {
    const { previous } = renderCarousel();

    fireEvent.click(previous);

    expectActiveSlide(2);
  });

  it('selects slides directly with dot controls', () => {
    renderCarousel();

    fireEvent.click(
      screen.getByRole('button', { name: 'Show slide 2: Bravo lamp' })
    );

    expectActiveSlide(1);
  });

  it('handles focused left and right arrow key navigation only for arrow keys', () => {
    const { carousel } = renderCarousel();

    carousel.focus();
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expectActiveSlide(1);

    fireEvent.keyDown(carousel, { key: 'Enter' });
    expectActiveSlide(1);

    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expectActiveSlide(0);
  });

  it('exposes accessible names for the carousel, controls, dots, and images', () => {
    const { carousel } = renderCarousel();

    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    expect(
      screen.getByRole('button', { name: 'Show previous product image' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show next product image' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show slide 1: Alpha pack' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Alpha pack product image' })
    ).toBeInTheDocument();
  });

  it('uses overflow-safe responsive layout and reduced-motion transition classes', () => {
    const { carousel, track, viewport } = renderCarousel();
    const firstSlide = screen
      .getByRole('img', { name: 'Alpha pack product image' })
      .closest('article');

    expect(carousel).toHaveClass('w-full', 'max-w-full', 'overflow-hidden');
    expect(viewport).toHaveClass('w-full', 'max-w-full', 'overflow-hidden');
    expect(track).toHaveClass(
      'flex',
      'w-full',
      'transition-transform',
      'motion-reduce:transition-none'
    );
    expect(firstSlide).toHaveClass('w-full', 'min-w-0', 'flex-[0_0_100%]');
    expect(
      screen.getByRole('img', { name: 'Alpha pack product image' })
    ).toHaveClass('max-w-full', 'object-cover');
  });

  it('renders nothing when no slides are provided', () => {
    const { container } = render(<ImageCarousel slides={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
