import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { clearToken, getToken, setUnauthorizedHandler } from './api.js';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Todos from './pages/Todos.jsx';

function ProtectedRoute({ token, children }) {
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default function App() {
  const [token, setToken] = useState(() => getToken());
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  function handleAuthenticated(nextToken) {
    setToken(nextToken);
    navigate('/todos', { replace: true });
  }

  function handleLogout() {
    clearToken();
    setToken(null);
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white p-4 shadow">
        <ul className="flex items-center gap-4">
          <li>
            <Link className="text-blue-600 hover:underline" to="/">
              Home
            </Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/about">
              About
            </Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/todos">
              Todos
            </Link>
          </li>
          <li className="ml-auto">
            {token ? (
              <button className="text-blue-600 hover:underline" type="button" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <Link className="text-blue-600 hover:underline" to="/login">
                Login
              </Link>
            )}
          </li>
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={token ? <Navigate to="/todos" replace /> : <Auth onAuthenticated={handleAuthenticated} />} />
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
