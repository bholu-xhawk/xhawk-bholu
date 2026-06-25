import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';

export default function App() {
  const baseLink = 'text-blue-600 hover:underline inline-block px-2 py-1 rounded';
  const activeLink = 'text-blue-700 font-semibold underline inline-block px-2 py-1 rounded';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow">
        <ul className="flex items-center gap-4 list-none m-0 p-0">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? activeLink : baseLink)}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) => (isActive ? activeLink : baseLink)}
            >
              About
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}

