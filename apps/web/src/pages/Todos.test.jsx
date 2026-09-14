import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Todos from './Todos.jsx';

function addTodo(text) {
  fireEvent.change(screen.getByLabelText(/new todo/i), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: /add todo/i }));
}

describe('Todos', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds a todo and shows it as pending', () => {
    render(<Todos />);

    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();

    addTodo('Buy oat milk');

    expect(screen.getByText('Buy oat milk')).toBeInTheDocument();
    expect(screen.getByText('Pending: 1')).toBeInTheDocument();
    expect(screen.getByText('Completed: 0')).toBeInTheDocument();
    expect(screen.queryByText(/no todos yet/i)).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('todos'))[0].text).toBe(
      'Buy oat milk'
    );
  });

  it('marks a todo completed with visible pending and completed distinctions', () => {
    render(<Todos />);

    addTodo('Ship the todo page');
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /mark ship the todo page complete/i,
      })
    );

    expect(screen.getByText('Pending: 0')).toBeInTheDocument();
    expect(screen.getByText('Completed: 1')).toBeInTheDocument();

    const completedSection = screen
      .getByRole('heading', { name: 'Completed' })
      .closest('section');
    expect(
      within(completedSection).getByText('Ship the todo page')
    ).toBeInTheDocument();
    expect(within(completedSection).getAllByText('Completed')).toHaveLength(2);
  });

  it('edits todo text and deletes the item', () => {
    render(<Todos />);

    addTodo('Draft release notes');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/edit todo/i), {
      target: { value: 'Publish release notes' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByText('Publish release notes')).toBeInTheDocument();
    expect(screen.queryByText('Draft release notes')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.queryByText('Publish release notes')).not.toBeInTheDocument();
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  it('loads persisted todos from localStorage', () => {
    window.localStorage.setItem(
      'todos',
      JSON.stringify([
        {
          id: 'persisted-1',
          text: 'Hydrate saved state',
          completed: true,
          createdAt: '2026-09-14T00:00:00.000Z',
          updatedAt: '2026-09-14T00:00:00.000Z',
        },
      ])
    );

    render(<Todos />);

    expect(screen.getByText('Hydrate saved state')).toBeInTheDocument();
    expect(screen.getByText('Pending: 0')).toBeInTheDocument();
    expect(screen.getByText('Completed: 1')).toBeInTheDocument();
  });

  it('recovers gracefully from malformed localStorage data', () => {
    window.localStorage.setItem('todos', '{not valid json');

    expect(() => render(<Todos />)).not.toThrow();
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
    expect(screen.getByText('Pending: 0')).toBeInTheDocument();
    expect(screen.getByText('Completed: 0')).toBeInTheDocument();
  });

  it('does not crash when localStorage is unavailable', () => {
    const localStorageDescriptor = Object.getOwnPropertyDescriptor(
      window,
      'localStorage'
    );

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage is unavailable');
      },
    });

    try {
      expect(() => render(<Todos />)).not.toThrow();
      expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, 'localStorage', localStorageDescriptor);
    }
  });
});
