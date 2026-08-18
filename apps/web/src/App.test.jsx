import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
  it('renders Home link in navigation and Home heading by default', () => {
    renderApp();

    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Home/i })).toBeInTheDocument();
  });

  it('adds and edits a todo from the routed Home page', () => {
    renderApp();

    const todoInput = screen.getByLabelText(/Todo item/i);
    fireEvent.change(todoInput, { target: { value: 'Write release notes' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    expect(screen.getByText('Write release notes')).toBeInTheDocument();
    expect(todoInput).toHaveValue('');

    const todoItem = screen.getByText('Write release notes').closest('li');
    fireEvent.click(within(todoItem).getByRole('button', { name: /Edit/i }));

    expect(todoInput).toHaveValue('Write release notes');
    expect(screen.getByRole('button', { name: /Update todo/i })).toBeInTheDocument();

    fireEvent.change(todoInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Update todo/i }));

    expect(screen.getByText('Write release notes')).toBeInTheDocument();

    fireEvent.change(todoInput, { target: { value: 'Publish release notes' } });
    fireEvent.click(screen.getByRole('button', { name: /Update todo/i }));

    expect(screen.getByText('Publish release notes')).toBeInTheDocument();
    expect(screen.queryByText('Write release notes')).not.toBeInTheDocument();
    expect(todoInput).toHaveValue('');
    expect(screen.getByRole('button', { name: /Add todo/i })).toBeInTheDocument();
  });

  it('does not create a todo for a whitespace-only submission', () => {
    renderApp();

    fireEvent.change(screen.getByLabelText(/Todo item/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Add todo/i }));

    const todoList = screen.getByRole('heading', { name: /Todo list/i }).parentElement;
    expect(screen.getByText(/No todos yet/i)).toBeInTheDocument();
    expect(within(todoList).queryByRole('listitem')).not.toBeInTheDocument();
  });
});
