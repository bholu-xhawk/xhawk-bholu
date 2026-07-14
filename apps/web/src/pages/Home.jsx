import React, { useEffect, useMemo, useState } from 'react';
import TodoForm from '../components/TodoForm.jsx';
import TodoItem from '../components/TodoItem.jsx';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from '../api/todos.js';

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const today = useMemo(() => {
    const now = new Date();
    return {
      day: now.toLocaleDateString(undefined, { weekday: 'long' }),
      date: now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }),
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTodos() {
      setLoading(true);
      setError('');
      try {
        const loadedTodos = await fetchTodos();
        if (active) setTodos(loadedTodos);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTodos();

    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(title) {
    setIsAdding(true);
    setError('');
    try {
      const todo = await createTodo(title);
      setTodos((currentTodos) => [...currentTodos, todo]);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggle(todo) {
    setError('');
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((currentTodos) => currentTodos.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(todo) {
    setError('');
    try {
      await deleteTodo(todo.id);
      setTodos((currentTodos) => currentTodos.filter((item) => item.id !== todo.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className="todo-page" aria-labelledby="todo-heading">
      <div className="todo-card">
        <header className="todo-header">
          <div>
            <p className="todo-day">{today.day}</p>
            <h1 id="todo-heading" className="todo-heading">Today&rsquo;s Tasks</h1>
          </div>
          <p className="todo-date">{today.date}</p>
        </header>

        {error ? <div className="todo-error" role="alert">{error}</div> : null}

        <div className="todo-list-wrap">
          {loading ? (
            <p className="todo-muted" role="status">Loading todos…</p>
          ) : todos.length ? (
            <ul className="todo-list" aria-label="Todo list">
              {todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </ul>
          ) : (
            <p className="todo-empty">No tasks yet. Add one to get started.</p>
          )}
        </div>

        <TodoForm onAdd={handleAdd} isAdding={isAdding} />
      </div>
    </section>
  );
}

