import React from 'react';
import PropTypes from 'prop-types';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

PublicOnlyRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white p-4 shadow" aria-label="Main navigation">
        <ul className="flex items-center gap-4">
          <li>
            <Link className="text-blue-600 hover:underline" to="/">Todos</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/about">About</Link>
          </li>
          <li className="ml-auto">
            {isAuthenticated ? (
              <button className="text-blue-600 hover:underline" type="button" onClick={logout}>
                Logout
              </button>
            ) : (
              <Link className="text-blue-600 hover:underline" to="/login">Login</Link>
            )}
          </li>
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><Signup /></PublicOnlyRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
