import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <nav className="bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
        <ul className="mx-auto flex max-w-5xl gap-5 text-sm font-medium">
          <li>
            <Link className="text-emerald-700 hover:text-emerald-900" to="/">Todos</Link>
          </li>
          <li>
            <Link className="text-slate-600 hover:text-slate-900" to="/about">About</Link>
          </li>
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}

