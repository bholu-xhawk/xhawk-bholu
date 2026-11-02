import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { clearStoredToken, getStoredToken, onUnauthorized } from './api.js';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Auth from './pages/Auth.jsx';
import Todos from './pages/Todos.jsx';

function ProtectedRoute({ token, children }) {
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ token, children }) {
  if (token) return <Navigate to="/todos" replace />;
  return children;
}

export default function App() {
  const [token, setToken] = useState(() => getStoredToken());
  const navigate = useNavigate();

  useEffect(() => {
    return onUnauthorized(() => {
      clearStoredToken();
      setToken('');
      navigate('/login', { replace: true });
    });
  }, [navigate]);

  function handleLogin(nextToken) {
    setToken(nextToken);
  }

  function handleLogout() {
    clearStoredToken();
    setToken('');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow">
        <ul className="flex items-center gap-4">
          <li>
            <Link className="text-blue-600 hover:underline" to="/">Home</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/about">About</Link>
          </li>
          {token ? (
            <>
              <li>
                <Link className="text-blue-600 hover:underline" to="/todos">Todos</Link>
              </li>
              <li className="ml-auto">
                <button className="text-blue-600 hover:underline" type="button" onClick={handleLogout}>Log out</button>
              </li>
            </>
          ) : (
            <li className="ml-auto">
              <Link className="text-blue-600 hover:underline" to="/login">Log in</Link>
            </li>
          )}
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/login"
            element={
              <GuestRoute token={token}>
                <Auth onLogin={handleLogin} />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute token={token}>
                <Auth onLogin={handleLogin} />
              </GuestRoute>
            }
          />
          <Route
            path="/todos"
            element={
              <ProtectedRoute token={token}>
                <Todos />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
