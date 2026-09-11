import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Home from './Home.jsx';
import { TODO_STORAGE_KEY } from '../utils/todoStorage.js';

beforeEach(() => {
  window.localStorage.clear();
});

function addTask(title) {
  fireEvent.change(screen.getByLabelText(/New task/i), {
    target: { value: title },
  });
  fireEvent.click(screen.getByRole('button', { name: /Add task/i }));
}

describe('Home', () => {
  it('adds a trimmed task and persists it as active', () => {
    render(<Home />);

    addTask('  Buy milk  ');

    const task = screen.getByRole('listitem');
    expect(within(task).getByText('Buy milk')).toBeInTheDocument();
    expect(within(task).getByText(/Status: Active/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added “Buy milk”.');
    expect(screen.getByLabelText(/New task/i)).toHaveValue('');

    const persistedTodos = JSON.parse(
      window.localStorage.getItem(TODO_STORAGE_KEY)
    );
    expect(persistedTodos).toEqual([
      expect.objectContaining({ title: 'Buy milk', completed: false }),
    ]);
  });

  it('rejects an empty add with feedback', () => {
    render(<Home />);

    addTask('   ');

    expect(screen.getByRole('status')).toHaveTextContent(
      'Enter a task before adding it.'
    );
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(TODO_STORAGE_KEY)).toBeNull();
  });

  it('marks a task complete and updates the persisted status', () => {
    render(<Home />);

    addTask('File report');
    fireEvent.click(screen.getByRole('button', { name: /Mark complete/i }));

    const task = screen.getByRole('listitem');
    expect(within(task).getByText(/Status: Completed/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Mark active/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Marked complete: “File report”.'
    );

    const persistedTodos = JSON.parse(
      window.localStorage.getItem(TODO_STORAGE_KEY)
    );
    expect(persistedTodos).toEqual([
      expect.objectContaining({ title: 'File report', completed: true }),
    ]);
  });

  it('deletes a task and persists the removal', () => {
    render(<Home />);

    addTask('Clean desk');
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    expect(screen.queryByText('Clean desk')).not.toBeInTheDocument();
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Deleted “Clean desk”.'
    );
    expect(JSON.parse(window.localStorage.getItem(TODO_STORAGE_KEY))).toEqual(
      []
    );
  });

  it('loads persisted tasks from localStorage on render', () => {
    window.localStorage.setItem(
      TODO_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'saved-1',
          title: 'Restored task',
          completed: true,
          createdAt: '2026-09-11T00:00:00.000Z',
        },
      ])
    );

    render(<Home />);

    const task = screen.getByRole('listitem');
    expect(within(task).getByText('Restored task')).toBeInTheDocument();
    expect(within(task).getByText(/Status: Completed/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Mark active/i })
    ).toBeInTheDocument();
  });
});
