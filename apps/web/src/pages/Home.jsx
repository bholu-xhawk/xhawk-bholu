import React, { useState } from 'react';
import { mockTodos } from '../mocks/todos.js';

function cloneTodo(todo) {
  return { ...todo };
}

export default function Home() {
  const [todos, setTodos] = useState(() => mockTodos.map(cloneTodo));
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  function handleAddTodo(event) {
    event.preventDefault();

    const title = newTodoTitle.trim();
    if (!title) {
      return;
    }

    setTodos((currentTodos) => {
      const nextId =
        currentTodos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;
      return [...currentTodos, { id: nextId, title, completed: false }];
    });
    setNewTodoTitle('');
  }

  function handleToggleTodo(id) {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  function handleDeleteTodo(id) {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  }

  return (
    <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Local state demo
        </p>
        <h1 className="mt-2 text-3xl font-bold">Todo App</h1>
        <p className="mt-2 text-gray-600">
          Add, complete, and delete frontend-only todos seeded from mock data.
        </p>
      </div>

      <form
        className="mb-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={handleAddTodo}
      >
        <label className="sr-only" htmlFor="new-todo">
          New todo
        </label>
        <input
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          id="new-todo"
          onChange={(event) => setNewTodoTitle(event.target.value)}
          placeholder="Add a todo"
          value={newTodoTitle}
        />
        <button
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
          type="submit"
        >
          Add todo
        </button>
      </form>

      <div className="mb-4 rounded-lg bg-gray-100 p-4" aria-live="polite">
        <p className="font-medium">
          {todos.length} total · {activeCount} active · {completedCount}{' '}
          completed
        </p>
      </div>

      {todos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          No todos yet. Add one above to get started.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Todo list">
          {todos.map((todo) => (
            <li
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              key={todo.id}
            >
              <label className="flex items-center gap-3">
                <input
                  checked={todo.completed}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600"
                  onChange={() => handleToggleTodo(todo.id)}
                  type="checkbox"
                />
                <span
                  className={
                    todo.completed
                      ? 'text-gray-500 line-through'
                      : 'font-medium text-gray-900'
                  }
                >
                  {todo.title}
                </span>
              </label>
              <button
                aria-label={`Delete ${todo.title}`}
                className="self-start rounded-md border border-red-200 px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 sm:self-auto"
                onClick={() => handleDeleteTodo(todo.id)}
                type="button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
