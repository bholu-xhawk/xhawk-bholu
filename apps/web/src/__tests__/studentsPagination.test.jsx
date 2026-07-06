import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Students from '../pages/Students.jsx';

function getRows() {
  return screen.queryAllByTestId('student-row');
}

describe('Students pagination', () => {
  test('initial state and pagination next', () => {
    render(<Students />);

    // initial page indicator
    expect(screen.getByTestId('page-indicator').textContent).toMatch(/Page 1 of 5/);

    // initial rows count equals default page size 10
    expect(getRows()).toHaveLength(10);

    // first row is Student 1
    expect(getRows()[0]).toHaveTextContent('Student 1');

    // click next
    fireEvent.click(screen.getByTestId('next-btn'));

    // first row on page 2 is Student 11
    expect(getRows()[0]).toHaveTextContent('Student 11');

    // still 10 rows
    expect(getRows()).toHaveLength(10);
  });

  test('change page size resets to page 1 and updates counts', () => {
    render(<Students />);

    // change page size to 5
    fireEvent.change(screen.getByTestId('page-size'), { target: { value: '5' } });

    expect(getRows()).toHaveLength(5);
    expect(screen.getByTestId('page-indicator').textContent).toMatch(/Page 1 of 10/);
    expect(getRows()[0]).toHaveTextContent('Student 1');
  });

  test('bounds for prev/next buttons', () => {
    render(<Students />);

    // prev disabled on first page
    expect(screen.getByTestId('prev-btn')).toBeDisabled();

    // go to last page
    const nextBtn = screen.getByTestId('next-btn');
    for (let i = 0; i < 10; i++) {
      // 5 total pages with default 10 page size -> click 4 times is enough, but loop safe
      if (nextBtn.disabled) break;
      fireEvent.click(nextBtn);
    }

    expect(nextBtn).toBeDisabled();
  });
});
