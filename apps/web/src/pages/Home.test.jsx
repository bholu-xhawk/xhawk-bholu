import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Home, { TODO_STORAGE_KEY } from './Home.jsx';

function getStoredTodos() {
  return JSON.parse(window.localStorage.getItem(TODO_STORAGE_KEY));
}

describe('Home', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('validates blank submissions and manages to-do items', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /Add/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a to-do before adding it.');
    expect(screen.getByText(/No to-dos yet/i)).toBeInTheDocument();

    const input = screen.getByLabelText(/New to-do/i);
    fireEvent.change(input, { target: { value: '  Write tests  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(screen.getByText('Write tests')).toBeInTheDocument();

    const completeCheckbox = screen.getByRole('checkbox', {
      name: /Mark Write tests as complete/i,
    });
    fireEvent.click(completeCheckbox);

    expect(completeCheckbox).toBeChecked();
    expect(screen.getByText('Write tests')).toHaveClass('line-through');

    fireEvent.click(screen.getByRole('button', { name: /Delete Write tests/i }));

    expect(screen.queryByText('Write tests')).not.toBeInTheDocument();
    expect(screen.getByText(/No to-dos yet/i)).toBeInTheDocument();
  });

  it('loads saved to-dos and persists changes', () => {
    window.localStorage.setItem(
      TODO_STORAGE_KEY,
      JSON.stringify([{ id: 'saved-1', text: 'Read docs', completed: true }])
    );

    render(<Home />);

    expect(screen.getByText('Read docs')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Mark Read docs as incomplete/i })
    ).toBeChecked();

    fireEvent.change(screen.getByLabelText(/New to-do/i), { target: { value: 'Ship feature' } });
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));

    expect(getStoredTodos()).toEqual(
      expect.arrayContaining([
        { id: 'saved-1', text: 'Read docs', completed: true },
        expect.objectContaining({ text: 'Ship feature', completed: false }),
      ])
    );
  });

  it('falls back to an empty list when saved to-dos are malformed', () => {
    window.localStorage.setItem(TODO_STORAGE_KEY, '{bad json');

    render(<Home />);

    expect(screen.getByText(/No to-dos yet/i)).toBeInTheDocument();
  });
});
