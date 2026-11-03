import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './api.js';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Auth from './pages/Auth.jsx';
import Todos from './pages/Todos.jsx';

function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function App() {
  const [hasToken, setHasToken] = useState(Boolean(getToken()));

  useEffect(() => {
    const checkToken = () => setHasToken(Boolean(getToken()));
    window.addEventListener('storage', checkToken);
    return () => window.removeEventListener('storage', checkToken);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow" aria-label="Primary navigation">
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
          {!hasToken ? (
            <li>
              <Link className="text-blue-600 hover:underline" to="/login">Sign in</Link>
            </li>
          ) : null}
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Auth onAuthenticated={() => setHasToken(true)} />} />
          <Route path="/todos" element={<RequireAuth><Todos /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  );
}
