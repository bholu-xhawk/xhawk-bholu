import { useState } from 'react';
import { loadTodos, saveTodos } from '../utils/todoStorage.js';

function createTodoId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function persistTodos(nextTodos) {
  saveTodos(nextTodos);
  return nextTodos;
}

export function useTodos() {
  const [todos, setTodos] = useState(() => loadTodos());
  const [feedback, setFeedback] = useState('');
  const [newTodoTitle, setNewTodoTitle] = useState('');

  function addTodo(event) {
    event?.preventDefault();

    const title = newTodoTitle.trim();

    if (!title) {
      setFeedback('Enter a task before adding it.');
      return false;
    }

    const todo = {
      id: createTodoId(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTodos((currentTodos) => persistTodos([todo, ...currentTodos]));
    setNewTodoTitle('');
    setFeedback(`Added “${title}”.`);
    return true;
  }

  function toggleTodo(id) {
    setTodos((currentTodos) => {
      const todo = currentTodos.find((item) => item.id === id);
      const nextTodos = currentTodos.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );

      persistTodos(nextTodos);

      if (todo) {
        setFeedback(
          `${todo.completed ? 'Marked active' : 'Marked complete'}: “${todo.title}”.`
        );
      }

      return nextTodos;
    });
  }

  function deleteTodo(id) {
    setTodos((currentTodos) => {
      const todo = currentTodos.find((item) => item.id === id);
      const nextTodos = currentTodos.filter((item) => item.id !== id);

      persistTodos(nextTodos);

      if (todo) {
        setFeedback(`Deleted “${todo.title}”.`);
      }

      return nextTodos;
    });
  }

  return {
    todos,
    feedback,
    newTodoTitle,
    setNewTodoTitle,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
