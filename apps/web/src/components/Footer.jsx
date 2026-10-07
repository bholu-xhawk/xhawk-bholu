import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-4 text-sm text-gray-600">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p>&copy; {currentYear} xhawk-bholu</p>
        <nav aria-label="Footer navigation">
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
      </div>
    </footer>
  );
}
