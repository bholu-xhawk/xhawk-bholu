import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { clearToken, hasToken } from './api.js';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Auth from './pages/Auth.jsx';
import Todos from './pages/Todos.jsx';

function ProtectedRoute({ authenticated, children }) {
  if (!authenticated) return <Navigate to="/auth" replace />;
  return children;
}

ProtectedRoute.propTypes = {
  authenticated: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

function Navigation({ authenticated, onLogout }) {
  const navigate = useNavigate();

  function handleLogout() {
    onLogout();
    navigate('/auth');
  }

  return (
    <nav className="p-4 bg-white shadow">
      <ul className="flex gap-4 items-center">
        <li>
          <Link className="text-blue-600 hover:underline" to="/">Home</Link>
        </li>
        <li>
          <Link className="text-blue-600 hover:underline" to="/about">About</Link>
        </li>
        {authenticated ? (
          <>
            <li>
              <Link className="text-blue-600 hover:underline" to="/todos">Todos</Link>
            </li>
            <li>
              <button className="text-blue-600 hover:underline" type="button" onClick={handleLogout}>
                Log out
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link className="text-blue-600 hover:underline" to="/auth">Log in</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

Navigation.propTypes = {
  authenticated: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => hasToken());

  function handleLogout() {
    clearToken();
    setAuthenticated(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navigation authenticated={authenticated} onLogout={handleLogout} />
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/auth"
            element={authenticated ? <Navigate to="/todos" replace /> : <Auth onAuthenticated={() => setAuthenticated(true)} />}
          />
          <Route
            path="/todos"
            element={
              <ProtectedRoute authenticated={authenticated}>
                <Todos onUnauthorized={() => setAuthenticated(false)} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
