import React, { useRef, useState } from 'react';

export default function TodoList() {
  const nextTodoId = useRef(1);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');

  const handleAddTodo = (event) => {
    event.preventDefault();

    const text = newTodo.trim();
    if (!text) {
      return;
    }

    const todo = { id: nextTodoId.current, text };
    nextTodoId.current += 1;

    setTodos((currentTodos) => [...currentTodos, todo]);
    setNewTodo('');
  };

  const handleDeleteTodo = (todoId) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== todoId));

    if (editingId === todoId) {
      setEditingId(null);
      setEditDraft('');
    }
  };

  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditDraft(todo.text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDraft('');
  };

  const handleSaveEdit = (event) => {
    event.preventDefault();

    const text = editDraft.trim();
    if (!text || editingId === null) {
      return;
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) => (todo.id === editingId ? { ...todo, text } : todo))
    );
    setEditingId(null);
    setEditDraft('');
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleAddTodo}>
        <label className="sr-only" htmlFor="new-todo">
          New todo
        </label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          id="new-todo"
          onChange={(event) => setNewTodo(event.target.value)}
          placeholder="Add a task"
          type="text"
          value={newTodo}
        />
        <button
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          type="submit"
        >
          Add todo
        </button>
      </form>

      {todos.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 p-4 text-center text-gray-500">
          No todos yet. Add one above to get started.
        </p>
      ) : (
        <ul className="mt-6 space-y-3" aria-label="Todo items">
          {todos.map((todo) => (
            <li
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              key={todo.id}
            >
              {editingId === todo.id ? (
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSaveEdit}>
                  <label className="sr-only" htmlFor={`edit-todo-${todo.id}`}>
                    Edit todo
                  </label>
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    id={`edit-todo-${todo.id}`}
                    onChange={(event) => setEditDraft(event.target.value)}
                    type="text"
                    value={editDraft}
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                      type="submit"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      onClick={handleCancelEdit}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-lg font-medium text-gray-900">{todo.text}</span>
                  <div className="flex gap-2">
                    <button
                      aria-label={`Edit ${todo.text}`}
                      className="rounded-lg border border-blue-200 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
                      onClick={() => handleStartEdit(todo)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${todo.text}`}
                      className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                      onClick={() => handleDeleteTodo(todo.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
