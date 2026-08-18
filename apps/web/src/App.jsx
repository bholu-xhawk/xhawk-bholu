import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Booklist from './pages/Booklist.jsx';
import BookDetails from './pages/BookDetails.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="p-4 bg-white shadow">
        <ul className="flex gap-4">
          <li>
            <Link className="text-blue-600 hover:underline" to="/">Home</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/about">About</Link>
          </li>
          <li>
            <Link className="text-blue-600 hover:underline" to="/booklist">Booklist</Link>
          </li>
        </ul>
      </nav>
      <main className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/booklist" element={<Booklist />} />
          <Route path="/booklist/:id" element={<BookDetails />} />
        </Routes>
      </main>
    </div>
  );
}
