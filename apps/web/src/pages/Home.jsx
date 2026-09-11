import React from 'react';
import { useTodos } from '../hooks/useTodos.js';

export default function Home() {
  const {
    todos,
    feedback,
    newTodoTitle,
    setNewTodoTitle,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useTodos();

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Local tasks
        </p>
        <h1 className="text-3xl font-bold text-gray-950">To-do list</h1>
        <p className="text-gray-600">
          Add tasks, mark them complete, and keep your list in this browser.
        </p>
      </div>

      <form className="rounded-2xl bg-white p-4 shadow" onSubmit={addTodo}>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="new-todo-title"
        >
          New task
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            id="new-todo-title"
            name="newTodoTitle"
            onChange={(event) => setNewTodoTitle(event.target.value)}
            placeholder="Write a task"
            type="text"
            value={newTodoTitle}
          />
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            type="submit"
          >
            Add task
          </button>
        </div>
      </form>

      <div
        aria-live="polite"
        className="min-h-6 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800"
        role="status"
      >
        {feedback || 'Your updates will appear here.'}
      </div>

      <section aria-labelledby="todo-list-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="text-xl font-semibold text-gray-950"
            id="todo-list-heading"
          >
            Tasks
          </h2>
          <p className="text-sm text-gray-500">
            {todos.length} {todos.length === 1 ? 'task' : 'tasks'} saved
          </p>
        </div>

        {todos.length > 0 ? (
          <ul className="space-y-3" aria-label="Tasks">
            {todos.map((todo) => (
              <li
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                key={todo.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p
                      className={`break-words text-lg font-medium ${
                        todo.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-950'
                      }`}
                    >
                      {todo.title}
                    </p>
                    <p className="text-sm font-semibold text-gray-600">
                      Status: {todo.completed ? 'Completed' : 'Active'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      onClick={() => toggleTodo(todo.id)}
                      type="button"
                    >
                      Mark {todo.completed ? 'active' : 'complete'}
                    </button>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                      onClick={() => deleteTodo(todo.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-600">
            No tasks yet. Add your first task above.
          </p>
        )}
      </section>
    </section>
  );
}
