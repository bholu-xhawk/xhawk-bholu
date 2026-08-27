import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Home from './Home.jsx';
import { todoSeedItems } from '../mocks/todos.js';

function renderHome() {
  render(<Home />);
}

function addTodo(title) {
  fireEvent.change(screen.getByLabelText(/New todo/i), {
    target: { value: title },
  });
  fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));
}

describe('Home', () => {
  it('renders seeded mock todos with counts', () => {
    renderHome();

    expect(
      screen.getByRole('heading', { name: /Todo App/i })
    ).toBeInTheDocument();
    for (const todo of todoSeedItems) {
      expect(screen.getByText(todo.title)).toBeInTheDocument();
    }
    expect(
      screen.getByText('3 total · 2 active · 1 completed')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Review the project brief/i })
    ).toBeChecked();
  });

  it('adds a non-empty todo and clears the input', () => {
    renderHome();

    addTodo('  Write interaction tests  ');

    expect(screen.getByText('Write interaction tests')).toBeInTheDocument();
    expect(screen.getByLabelText(/New todo/i)).toHaveValue('');
    expect(
      screen.getByText('4 total · 3 active · 1 completed')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Write interaction tests/i })
    ).not.toBeChecked();
  });

  it('disables adding while the trimmed todo input is empty', () => {
    renderHome();

    const input = screen.getByLabelText(/New todo/i);
    const addButton = screen.getByRole('button', { name: /Add todo/i });

    expect(addButton).toBeDisabled();

    fireEvent.change(input, {
      target: { value: '   ' },
    });
    expect(addButton).toBeDisabled();
    fireEvent.click(addButton);

    expect(screen.getAllByRole('listitem')).toHaveLength(todoSeedItems.length);
    expect(input).toHaveValue('   ');
    expect(
      screen.getByText('3 total · 2 active · 1 completed')
    ).toBeInTheDocument();

    fireEvent.change(input, {
      target: { value: '  Schedule demo  ' },
    });
    expect(addButton).toBeEnabled();
  });

  it('toggles a todo completed state in the UI', () => {
    renderHome();

    const checkbox = screen.getByRole('checkbox', {
      name: /Build the todo workflow/i,
    });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.getByText('Build the todo workflow')).toHaveClass(
      'line-through'
    );
    expect(
      screen.getByText('3 total · 1 active · 2 completed')
    ).toBeInTheDocument();
  });

  it('deletes a todo immediately and shows the empty state when all are removed', () => {
    renderHome();

    fireEvent.click(
      screen.getByRole('button', { name: /Delete Build the todo workflow/i })
    );

    expect(
      screen.queryByText('Build the todo workflow')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('2 total · 1 active · 1 completed')
    ).toBeInTheDocument();

    for (const item of screen.getAllByRole('listitem')) {
      fireEvent.click(within(item).getByRole('button', { name: /Delete/i }));
    }

    expect(screen.getByText(/No todos yet/i)).toBeInTheDocument();
    expect(
      screen.getByText('0 total · 0 active · 0 completed')
    ).toBeInTheDocument();
  });
});
