import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow" aria-label="Primary navigation">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link className="text-lg font-bold text-gray-950" to="/">Todo Workspace</Link>
          <Link className="text-blue-600 hover:underline" to="/about">About</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
