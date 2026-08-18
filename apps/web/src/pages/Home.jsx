import React, { useRef, useState } from 'react';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const nextTodoId = useRef(1);

  const isEditing = editingId !== null;

  function handleSubmit(event) {
    event.preventDefault();

    const text = draft.trim();
    if (!text) {
      return;
    }

    if (isEditing) {
      setTodos((currentTodos) =>
        currentTodos.map((todo) => (todo.id === editingId ? { ...todo, text } : todo))
      );
      setEditingId(null);
    } else {
      setTodos((currentTodos) => [...currentTodos, { id: nextTodoId.current, text }]);
      nextTodoId.current += 1;
    }

    setDraft('');
  }

  function handleEdit(todo) {
    setDraft(todo.text);
    setEditingId(todo.id);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="mt-2 text-gray-600">
          {isEditing ? 'Update the selected todo item.' : 'Add todo items to your list.'}
        </p>
      </div>

      <form className="rounded-lg bg-white p-4 shadow" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700" htmlFor="todo-input">
          Todo item
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            id="todo-input"
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Enter a todo"
            type="text"
            value={draft}
          />
          <button
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            type="submit"
          >
            {isEditing ? 'Update todo' : 'Add todo'}
          </button>
        </div>
      </form>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="text-xl font-semibold">Todo list</h2>
        {todos.length === 0 ? (
          <p className="mt-3 text-gray-600">No todos yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {todos.map((todo) => (
              <li
                className="flex items-center justify-between gap-3 rounded border border-gray-200 p-3"
                key={todo.id}
              >
                <span>{todo.text}</span>
                <button
                  className="text-sm font-medium text-blue-600 hover:underline"
                  onClick={() => handleEdit(todo)}
                  type="button"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
