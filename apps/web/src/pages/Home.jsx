import React, { useMemo, useState } from 'react';
import { mockTodos } from '../mocks/todos.js';

function cloneTodo(todo) {
  return { ...todo };
}

export default function Home() {
  const [todos, setTodos] = useState(() => mockTodos.map(cloneTodo));
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos]
  );
  const activeCount = todos.length - completedCount;

  function handleAddTodo(event) {
    event.preventDefault();

    const title = newTodoTitle.trim();
    if (!title) {
      return;
    }

    setTodos((currentTodos) => {
      const nextId = currentTodos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;

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
    <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Frontend-only todos
        </p>
        <h1 className="text-3xl font-bold">Todo App</h1>
        <p className="mt-2 text-gray-600">
          Track local tasks with mock data. Changes stay in memory and do not persist to a backend.
        </p>
      </div>

      <form className="mb-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleAddTodo}>
        <label className="sr-only" htmlFor="new-todo">
          New todo
        </label>
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          id="new-todo"
          name="new-todo"
          onChange={(event) => setNewTodoTitle(event.target.value)}
          placeholder="Add a todo"
          type="text"
          value={newTodoTitle}
        />
        <button
          className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          type="submit"
        >
          Add todo
        </button>
      </form>

      <div className="mb-4 rounded-lg bg-gray-100 p-4 text-sm text-gray-700" aria-live="polite">
        {todos.length} total · {activeCount} active · {completedCount} completed
      </div>

      {todos.length > 0 ? (
        <ul className="divide-y divide-gray-200" aria-label="Todo list">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-3 py-3">
              <input
                aria-label={`Mark ${todo.title} as ${todo.completed ? 'active' : 'done'}`}
                checked={todo.completed}
                className="h-5 w-5 rounded border-gray-300 text-blue-600"
                onChange={() => handleToggleTodo(todo.id)}
                type="checkbox"
              />
              <span
                className={`flex-1 ${
                  todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}
              >
                {todo.title}
              </span>
              <button
                aria-label={`Delete ${todo.title}`}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => handleDeleteTodo(todo.id)}
                type="button"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-600">
          No todos yet. Add one above to get started.
        </p>
      )}
    </section>
  );
}
