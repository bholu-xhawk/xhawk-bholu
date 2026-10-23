import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import ImageCarousel from './ImageCarousel.jsx';

const slides = [
  { src: '/images/product-1.svg', alt: 'Front view of the daypack' },
  { src: '/images/product-2.svg', alt: 'Interior organizer pockets' },
  { src: '/images/product-3.svg', alt: 'Side bottle pocket detail' },
];

function renderCarousel(customSlides = slides) {
  return render(<ImageCarousel slides={customSlides} />);
}

function carousel() {
  return screen.getByRole('region', { name: /product image carousel/i });
}

function expectActiveSlide(position, alt) {
  expect(screen.getByText(`Image ${position} of ${slides.length}: ${alt}`)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: new RegExp(`show product image ${position}`, 'i') })).toHaveAttribute(
    'aria-current',
    'true'
  );
}

describe('ImageCarousel', () => {
  it('renders the first slide as the active position by default', () => {
    renderCarousel();

    expect(carousel()).toBeInTheDocument();
    expect(screen.getByAltText('Front view of the daypack')).toBeInTheDocument();
    expectActiveSlide(1, 'Front view of the daypack');
  });

  it('moves forward and backward with labelled controls', () => {
    renderCarousel();

    fireEvent.click(screen.getByRole('button', { name: /show next product image/i }));
    expectActiveSlide(2, 'Interior organizer pockets');

    fireEvent.click(screen.getByRole('button', { name: /show previous product image/i }));
    expectActiveSlide(1, 'Front view of the daypack');
  });

  it('wraps next navigation from the final slide to the first slide', () => {
    renderCarousel();

    fireEvent.click(screen.getByRole('button', { name: /show next product image/i }));
    fireEvent.click(screen.getByRole('button', { name: /show next product image/i }));
    expectActiveSlide(3, 'Side bottle pocket detail');

    fireEvent.click(screen.getByRole('button', { name: /show next product image/i }));
    expectActiveSlide(1, 'Front view of the daypack');
  });

  it('wraps previous navigation from the first slide to the final slide', () => {
    renderCarousel();

    fireEvent.click(screen.getByRole('button', { name: /show previous product image/i }));

    expectActiveSlide(3, 'Side bottle pocket detail');
  });

  it('selects a slide directly with labelled dots', () => {
    renderCarousel();

    fireEvent.click(screen.getByRole('button', { name: /show product image 3/i }));

    expectActiveSlide(3, 'Side bottle pocket detail');
  });

  it('responds to left and right arrow keys only from the focusable carousel region', () => {
    renderCarousel();
    const region = carousel();

    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expectActiveSlide(1, 'Front view of the daypack');

    region.focus();
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expectActiveSlide(2, 'Interior organizer pockets');

    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expectActiveSlide(1, 'Front view of the daypack');
  });

  it('marks only the active dot with the accessible current state', () => {
    renderCarousel();

    const dotGroup = screen.getByRole('group', { name: /choose product image/i });
    const dots = within(dotGroup).getAllByRole('button');

    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute('aria-current', 'true');
    expect(dots[1]).not.toHaveAttribute('aria-current');
    expect(dots[2]).not.toHaveAttribute('aria-current');
  });

  it('keeps animation behind motion-safe classes and disables it for reduced motion', () => {
    renderCarousel();

    expect(screen.getByTestId('carousel-track')).toHaveClass(
      'motion-safe:transition-transform',
      'motion-safe:duration-300',
      'motion-reduce:transition-none',
      'motion-reduce:duration-0'
    );
  });

  it('renders nothing for empty slide input', () => {
    const { container } = renderCarousel([]);

    expect(container).toBeEmptyDOMElement();
  });

  it('omits controls and keyboard focus for a single slide', () => {
    renderCarousel([{ src: '/images/product-1.svg', alt: 'Only product image' }]);

    const region = carousel();
    expect(region).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('button', { name: /show next product image/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show previous product image/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /choose product image/i })).not.toBeInTheDocument();
    expect(screen.getByText('Image 1 of 1: Only product image')).toBeInTheDocument();
  });
});
