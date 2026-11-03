import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { getStoredToken } from './api.js';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Todos from './pages/Todos.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow">
        <ul className="flex gap-4">
          <li>
            <Link className="text-blue-600 hover:underline" to="/">Home</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/about">About</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/todos">Todos</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/login">Login</Link>
          </li>
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/todos" element={getStoredToken() ? <Todos /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
