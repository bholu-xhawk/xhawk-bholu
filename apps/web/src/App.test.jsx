import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LOCAL_STORAGE_KEY } from './pages/Home.jsx';

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('supports adding, editing, completing, and deleting todos', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: /your to do/i })).toBeInTheDocument();
    expect(screen.getByText(/0 tasks remaining/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/add new task/i), {
      target: { value: '  Buy milk  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add todo/i }));

    expect(screen.getByRole('button', { name: /edit buy milk/i })).toBeInTheDocument();
    expect(screen.getByText(/1 task remaining/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit buy milk/i }));
    const editInput = screen.getByRole('textbox', { name: /edit todo buy milk/i });
    fireEvent.change(editInput, { target: { value: 'Buy oat milk' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    expect(
      screen.getByRole('button', { name: /edit buy oat milk/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('checkbox', { name: /mark buy oat milk complete/i })
    );

    expect(screen.getByText(/0 tasks remaining/i)).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /mark buy oat milk incomplete/i })
    ).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /delete buy oat milk/i }));

    expect(screen.queryByText(/buy oat milk/i)).not.toBeInTheDocument();
    expect(screen.getByText(/0 tasks remaining/i)).toBeInTheDocument();
  });

  it('loads todos from localStorage and saves todo changes', async () => {
    window.localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify([{ id: 'saved-1', text: 'Read docs', completed: false }])
    );

    renderApp();

    expect(screen.getByRole('button', { name: /edit read docs/i })).toBeInTheDocument();
    expect(screen.getByText(/1 task remaining/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /mark read docs complete/i }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY))).toEqual([
        { id: 'saved-1', text: 'Read docs', completed: true },
      ]);
    });
  });

  it('ignores malformed localStorage data', () => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, '{not valid json');

    renderApp();

    expect(screen.getByText(/add your first task/i)).toBeInTheDocument();
    expect(screen.getByText(/0 tasks remaining/i)).toBeInTheDocument();
  });
});
