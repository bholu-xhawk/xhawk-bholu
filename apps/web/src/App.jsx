import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Product from './pages/Product.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white p-4 shadow">
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
          <li>
            <Link className="text-blue-600 hover:underline" to="/products/demo">
              Product
            </Link>
          </li>
        </ul>
      </nav>
      <main className="min-w-0 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products/demo" element={<Product />} />
        </Routes>
      </main>
    </div>
  );
}
