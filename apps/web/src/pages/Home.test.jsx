import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Home from './Home.jsx';
import { mockTodos } from '../mocks/todos.js';

describe('Home todo page', () => {
  it('renders seeded mock todos with summary counts', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: /Todo App/i })).toBeInTheDocument();
    for (const todo of mockTodos) {
      expect(screen.getByText(todo.title)).toBeInTheDocument();
    }
    expect(screen.getByRole('status')).toHaveTextContent('3 total • 1 completed • 2 active');
  });

  it('adds a new todo from non-empty input', () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/New todo/i), {
      target: { value: '  Write interaction tests  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(screen.getByText('Write interaction tests')).toBeInTheDocument();
    expect(screen.getByLabelText(/New todo/i)).toHaveValue('');
    expect(screen.getByRole('status')).toHaveTextContent('4 total • 1 completed • 3 active');
  });

  it('ignores empty todo submissions', () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/New todo/i), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(screen.getAllByRole('listitem')).toHaveLength(mockTodos.length);
    expect(screen.getByRole('status')).toHaveTextContent('3 total • 1 completed • 2 active');
  });

  it('toggles a todo as done in the UI', () => {
    render(<Home />);

    const checkbox = screen.getByRole('checkbox', {
      name: /Mark Build the todo interface as done/i,
    });
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    const todoRow = screen.getByText('Build the todo interface').closest('li');
    expect(within(todoRow).getByText('Done')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('3 total • 2 completed • 1 active');
  });

  it('deletes a todo immediately and shows the empty state when all todos are removed', () => {
    render(<Home />);

    fireEvent.click(
      screen.getByRole('button', { name: /Delete Review project requirements/i })
    );
    expect(screen.queryByText('Review project requirements')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 total • 0 completed • 2 active');

    fireEvent.click(screen.getByRole('button', { name: /Delete Build the todo interface/i }));
    fireEvent.click(screen.getByRole('button', { name: /Delete Verify interactions with tests/i }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No todos yet. Add one to get started.');
    expect(screen.getByText('Your todo list is empty.')).toBeInTheDocument();
  });
});
