import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Home from './Home.jsx';
import { mockTodos } from '../mocks/todos.js';

describe('Home', () => {
  it('renders seeded mock todos and summary counts', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { name: /todo app/i })).toBeInTheDocument();
    for (const todo of mockTodos) {
      expect(screen.getByText(todo.title)).toBeInTheDocument();
    }
    expect(screen.getByText(/3 total/i)).toBeInTheDocument();
    expect(screen.getByText(/2 active/i)).toBeInTheDocument();
    expect(screen.getByText(/1 completed/i)).toBeInTheDocument();
  });

  it('adds a new todo from non-empty input', () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/new todo/i), {
      target: { value: '  Draft release notes  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));

    expect(screen.getByText('Draft release notes')).toBeInTheDocument();
    expect(screen.getByText(/4 total/i)).toBeInTheDocument();
    expect(screen.getByText(/3 active/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new todo/i)).toHaveValue('');
  });

  it('ignores empty todo submissions', () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/new todo/i), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));

    expect(screen.getAllByRole('listitem')).toHaveLength(mockTodos.length);
    expect(screen.getByText(/3 total/i)).toBeInTheDocument();
  });

  it('toggles a todo as completed in the UI', () => {
    render(<Home />);

    const toggle = screen.getByRole('checkbox', {
      name: /mark plan the weekly sprint as done/i,
    });
    const todoTitle = screen.getByText('Plan the weekly sprint');

    expect(toggle).not.toBeChecked();
    expect(todoTitle).not.toHaveClass('line-through');

    fireEvent.click(toggle);

    expect(
      screen.getByRole('checkbox', {
        name: /mark plan the weekly sprint as active/i,
      })
    ).toBeChecked();
    expect(todoTitle).toHaveClass('line-through');
    expect(screen.getByText(/1 active/i)).toBeInTheDocument();
    expect(screen.getByText(/2 completed/i)).toBeInTheDocument();
  });

  it('deletes todos and shows the empty state when none remain', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /delete plan the weekly sprint/i }));
    expect(screen.queryByText('Plan the weekly sprint')).not.toBeInTheDocument();
    expect(screen.getByText(/2 total/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete review pull requests/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete update project notes/i }));

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
    expect(screen.getByText(/0 total/i)).toBeInTheDocument();
  });
});
