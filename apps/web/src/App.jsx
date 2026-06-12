import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import OnboardingGate from './components/OnboardingGate.jsx';
import Welcome from './pages/Welcome.jsx';

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
        </ul>
      </nav>
      <main className="p-6">
        <OnboardingGate>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/welcome" element={<Welcome />} />
          </Routes>
        </OnboardingGate>
      </main>
    </div>
  );
}

