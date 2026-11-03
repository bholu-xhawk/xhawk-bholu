import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Auth from './pages/Auth.jsx';
import Todos from './pages/Todos.jsx';
import { clearStoredToken, getStoredToken } from './lib/api.js';

function ProtectedTodos({ token, onUnauthorized }) {
  if (!token) return <Navigate to="/auth" replace />;
  return <Todos token={token} onUnauthorized={onUnauthorized} />;
}

ProtectedTodos.propTypes = {
  token: PropTypes.string,
  onUnauthorized: PropTypes.func.isRequired,
};

export default function App() {
  const [token, setToken] = useState(() => getStoredToken());
  const navigate = useNavigate();

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    navigate('/auth', { replace: true });
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('todo-session-expired', logout);
    return () => window.removeEventListener('todo-session-expired', logout);
  }, [logout]);

  function authenticated(nextToken) {
    setToken(nextToken);
    navigate('/todos', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white p-4 shadow">
        <ul className="flex items-center gap-4">
          <li>
            <Link className="text-blue-600 hover:underline" to="/">Home</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/about">About</Link>
          </li>
          {token ? (
            <li>
              <Link className="text-blue-600 hover:underline" to="/todos">Todos</Link>
            </li>
          ) : null}
          <li className="ml-auto">
            {token ? (
              <button className="text-blue-600 hover:underline" type="button" onClick={logout}>
                Log out
              </button>
            ) : (
              <Link className="text-blue-600 hover:underline" to="/auth">Log in</Link>
            )}
          </li>
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={token ? <Navigate to="/todos" replace /> : <Auth onAuthenticated={authenticated} />} />
          <Route path="/todos" element={<ProtectedTodos token={token} onUnauthorized={logout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
