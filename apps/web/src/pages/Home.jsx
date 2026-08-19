import React from 'react';
import TodoList from '../components/TodoList.jsx';

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold">Todo List</h1>
        <p className="mt-2 text-gray-600">
          Add tasks, edit them inline, and remove anything you have finished.
        </p>
      </div>
      <TodoList />
    </div>
  );
}
