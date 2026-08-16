import React, { useEffect, useMemo, useState } from 'react';

export const LOCAL_STORAGE_KEY = 'your-todo.todos';

function createTodo(text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    completed: false,
  };
}

function isSavedTodo(todo) {
  return (
    todo &&
    typeof todo.id === 'string' &&
    typeof todo.text === 'string' &&
    typeof todo.completed === 'boolean'
  );
}

function loadSavedTodos() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const savedTodos = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!savedTodos) {
      return [];
    }

    const parsedTodos = JSON.parse(savedTodos);
    return Array.isArray(parsedTodos) ? parsedTodos.filter(isSavedTodo) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [todos, setTodos] = useState(loadSavedTodos);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const remainingCount = useMemo(
    () => todos.filter((todo) => !todo.completed).length,
    [todos]
  );

  const handleAddTodo = (event) => {
    event.preventDefault();

    const trimmedText = newTodoText.trim();
    if (!trimmedText) {
      return;
    }

    setTodos((currentTodos) => [...currentTodos, createTodo(trimmedText)]);
    setNewTodoText('');
  };

  const handleToggleTodo = (todoId) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (todoId) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== todoId));

    if (editingTodo?.id === todoId) {
      setEditingTodo(null);
    }
  };

  const handleStartEdit = (todo) => {
    setEditingTodo({ id: todo.id, text: todo.text });
  };

  const handleSaveEdit = () => {
    if (!editingTodo) {
      return;
    }

    const trimmedText = editingTodo.text.trim();

    if (trimmedText) {
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === editingTodo.id ? { ...todo, text: trimmedText } : todo
        )
      );
    }

    setEditingTodo(null);
  };

  const handleEditKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSaveEdit();
    }

    if (event.key === 'Escape') {
      setEditingTodo(null);
    }
  };

  return (
    <section className="todo-card" aria-labelledby="todo-heading">
      <p className="todo-eyebrow">Make today simple</p>
      <h1 id="todo-heading">Your To Do</h1>
      <p className="todo-quote">Small steps, steady progress.</p>

      <form className="todo-form" onSubmit={handleAddTodo}>
        <label className="sr-only" htmlFor="new-todo">
          Add new task
        </label>
        <input
          id="new-todo"
          type="text"
          value={newTodoText}
          onChange={(event) => setNewTodoText(event.target.value)}
          placeholder="Add new task"
        />
        <button type="submit" aria-label="Add todo">
          +
        </button>
      </form>

      <ul className="todo-list" aria-label="Todo list">
        {todos.map((todo) => {
          const isEditing = editingTodo?.id === todo.id;

          return (
            <li
              className={`todo-row${todo.completed ? ' todo-row-completed' : ''}`}
              key={todo.id}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
                aria-label={`Mark ${todo.text} ${
                  todo.completed ? 'incomplete' : 'complete'
                }`}
              />

              {isEditing ? (
                <input
                  className="todo-edit-input"
                  type="text"
                  value={editingTodo.text}
                  onBlur={handleSaveEdit}
                  onChange={(event) =>
                    setEditingTodo({ ...editingTodo, text: event.target.value })
                  }
                  onKeyDown={handleEditKeyDown}
                  aria-label={`Edit todo ${todo.text}`}
                  autoFocus
                />
              ) : (
                <button
                  className="todo-title-button"
                  type="button"
                  onClick={() => handleStartEdit(todo)}
                  aria-label={`Edit ${todo.text}`}
                >
                  {todo.text}
                </button>
              )}

              <button
                className="todo-delete-button"
                type="button"
                onClick={() => handleDeleteTodo(todo.id)}
                aria-label={`Delete ${todo.text}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      {todos.length === 0 ? (
        <p className="todo-empty">Add your first task to get started.</p>
      ) : null}

      <p className="todo-count" aria-live="polite">
        {remainingCount} {remainingCount === 1 ? 'task' : 'tasks'} remaining
      </p>
    </section>
  );
}
