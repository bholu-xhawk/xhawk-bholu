import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

const TODOS_STORAGE_KEY = 'web.todos';

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function addTask(text) {
  fireEvent.change(screen.getByLabelText(/new task/i), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: /add task/i }));
}

describe('App to-do behavior', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('presents the root route as the to-do app', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /to-do app/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute(
      'href',
      '/about'
    );
    expect(
      screen.getByRole('heading', { name: /to-do app/i })
    ).toBeInTheDocument();
  });

  it('adds a trimmed valid task and persists it', async () => {
    renderApp();

    addTask('  Buy milk  ');

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.queryByText('  Buy milk  ')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/new task/i)).toHaveValue('');

    await waitFor(() => {
      const savedTodos = JSON.parse(
        window.localStorage.getItem(TODOS_STORAGE_KEY)
      );
      expect(savedTodos).toEqual([
        expect.objectContaining({
          text: 'Buy milk',
          completed: false,
          id: expect.any(String),
          createdAt: expect.any(String),
        }),
      ]);
    });
  });

  it('rejects an empty task with an inline validation error', () => {
    renderApp();

    addTask('   ');

    expect(screen.getByRole('alert')).toHaveTextContent(
      /enter a task before adding it/i
    );
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('toggles a task completion status and saves the change', async () => {
    renderApp();
    addTask('Review pull request');

    const checkbox = screen.getByRole('checkbox', {
      name: /toggle review pull request/i,
    });
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    await waitFor(() => {
      const [savedTodo] = JSON.parse(
        window.localStorage.getItem(TODOS_STORAGE_KEY)
      );
      expect(savedTodo.completed).toBe(true);
    });
  });

  it('deletes a task and returns to the empty state', async () => {
    renderApp();
    addTask('Archive notes');

    fireEvent.click(
      screen.getByRole('button', { name: /delete archive notes/i })
    );

    expect(screen.queryByText('Archive notes')).not.toBeInTheDocument();
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem(TODOS_STORAGE_KEY))
      ).toEqual([]);
    });
  });

  it('loads saved tasks from localStorage', () => {
    window.localStorage.setItem(
      TODOS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'saved-task-1',
          text: 'Restore saved task',
          completed: true,
          createdAt: '2026-09-11T00:00:00.000Z',
        },
      ])
    );

    renderApp();

    expect(screen.getByText('Restore saved task')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /toggle restore saved task/i })
    ).toBeChecked();
  });

  it('survives malformed saved data without crashing', () => {
    window.localStorage.setItem(TODOS_STORAGE_KEY, '{not valid json');

    renderApp();

    expect(screen.getByRole('alert')).toHaveTextContent(
      /could not restore your saved tasks/i
    );
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('isolates localStorage between tests and starts empty when nothing is saved', () => {
    renderApp();

    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
    expect(screen.queryByText('Restore saved task')).not.toBeInTheDocument();
  });

  it('shows a recoverable error when saving changes fails', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full');
    });

    renderApp();
    addTask('Cannot persist yet');

    expect(screen.getByText('Cannot persist yet')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/could not save/i);
  });
});
