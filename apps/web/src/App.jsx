import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow">
        <ul className="flex gap-4">
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
        </ul>
      </nav>
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
