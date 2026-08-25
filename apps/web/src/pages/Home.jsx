import React, { useState } from 'react';
import { mockTodos } from '../mocks/todos.js';

export default function Home() {
  const [todos, setTodos] = useState(() => mockTodos.map((todo) => ({ ...todo })));
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
      const nextId = currentTodos.length
        ? Math.max(...currentTodos.map((todo) => todo.id)) + 1
        : 1;

      return [
        ...currentTodos,
        {
          id: nextId,
          title,
          completed: false,
        },
      ];
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
    <section className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Frontend-only workflow
        </p>
        <h1 className="mt-2 text-3xl font-bold">Todo App</h1>
        <p className="mt-2 text-gray-600">
          Manage an in-memory todo list seeded from local mock data.
        </p>
      </div>

      <form className="mb-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleAddTodo}>
        <label className="sr-only" htmlFor="new-todo">
          New todo
        </label>
        <input
          id="new-todo"
          className="flex-1 rounded border border-gray-300 px-3 py-2"
          type="text"
          value={newTodoTitle}
          onChange={(event) => setNewTodoTitle(event.target.value)}
          placeholder="Add a todo"
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          type="submit"
        >
          Add todo
        </button>
      </form>

      <div className="mb-4 rounded bg-gray-100 px-4 py-3 text-sm text-gray-700" role="status">
        {todos.length === 0
          ? 'No todos yet. Add one to get started.'
          : `${todos.length} total • ${completedCount} completed • ${activeCount} active`}
      </div>

      {todos.length > 0 ? (
        <ul className="divide-y divide-gray-200" aria-label="Todo list">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 py-3">
              <input
                id={`todo-${todo.id}`}
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
                aria-label={`Mark ${todo.title} as ${todo.completed ? 'active' : 'done'}`}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label
                htmlFor={`todo-${todo.id}`}
                className={`flex-1 ${
                  todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {todo.title}
              </label>
              <span className="text-sm text-gray-500">
                {todo.completed ? 'Done' : 'Active'}
              </span>
              <button
                className="rounded border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                type="button"
                aria-label={`Delete ${todo.title}`}
                onClick={() => handleDeleteTodo(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-dashed border-gray-300 p-6 text-center text-gray-500">
          Your todo list is empty.
        </p>
      )}
    </section>
  );
}
