import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

function renderApp() {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

describe('App', () => {
  it('renders the todo app on the default route', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Todo List/i })).toBeInTheDocument();
    expect(screen.getByText(/No todos yet/i)).toBeInTheDocument();
  });

  it('adds, cancels editing, saves editing, and deletes a todo', () => {
    renderApp();

    const newTodoInput = screen.getByLabelText(/New todo/i);
    fireEvent.change(newTodoInput, { target: { value: '  Buy milk  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.queryByText(/No todos yet/i)).not.toBeInTheDocument();
    expect(newTodoInput).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    const editInput = screen.getByLabelText(/Edit todo/i);
    fireEvent.change(editInput, { target: { value: 'Buy oat milk' } });
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.queryByText('Buy oat milk')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText(/Edit todo/i), {
      target: { value: '  Buy oat milk  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(screen.getByText('Buy oat milk')).toBeInTheDocument();
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    expect(screen.queryByText('Buy oat milk')).not.toBeInTheDocument();
    expect(screen.getByText(/No todos yet/i)).toBeInTheDocument();
  });
});
