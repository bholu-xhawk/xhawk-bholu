import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <nav
        className="border-b border-gray-200 bg-white shadow-sm"
        aria-label="Primary navigation"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link className="text-lg font-bold text-gray-950" to="/">
            Table Of Book
          </Link>
          <ul className="flex gap-4">
            <li>
              <Link className="text-blue-700 hover:underline" to="/">
                Books
              </Link>
            </li>
            <li>
              <Link className="text-blue-700 hover:underline" to="/about">
                About
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
