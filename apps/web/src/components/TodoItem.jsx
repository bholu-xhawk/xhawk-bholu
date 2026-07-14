import React from 'react';
import PropTypes from 'prop-types';

export default function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className="todo-item">
      <button
        className={`todo-complete-button ${todo.completed ? 'todo-complete-button--done' : ''}`}
        type="button"
        aria-label={todo.completed ? `Mark ${todo.title} incomplete` : `Mark ${todo.title} complete`}
        aria-pressed={todo.completed}
        onClick={() => onToggle(todo)}
      >
        {todo.completed ? '✓' : ''}
      </button>
      <span className={`todo-title ${todo.completed ? 'todo-title--done' : ''}`}>{todo.title}</span>
      <button className="todo-delete-button" type="button" onClick={() => onDelete(todo)}>
        <span aria-hidden="true">×</span>
        <span className="sr-only">Delete {todo.title}</span>
      </button>
    </li>
  );
}

TodoItem.propTypes = {
  todo: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    completed: PropTypes.bool.isRequired,
  }).isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
