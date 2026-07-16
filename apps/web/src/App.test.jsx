import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

jest.mock('./api/todos.js', () => ({
  listTodos: jest.fn(() => Promise.resolve([])),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
}));

describe('App', () => {
  it('renders Todos link in navigation and Todos heading by default', async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Todos/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Todos/i })).toBeInTheDocument();
  });
});
