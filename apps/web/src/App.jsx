import React, { useEffect, useState } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';

function AccordionDemo() {
  const [items, setItems] = useState([]);
  const [openItemIds, setOpenItemIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadAccordionItems() {
      try {
        const response = await fetch('/api/accordion');

        if (!response.ok) {
          throw new Error('Unable to load accordion items.');
        }

        const data = await response.json();
        if (isActive) {
          setItems(data);
          setError('');
        }
      } catch (err) {
        if (isActive) {
          setError('Unable to load accordion items.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadAccordionItems();

    return () => {
      isActive = false;
    };
  }, []);

  function toggleItem(itemId) {
    setOpenItemIds((currentIds) => (
      currentIds.includes(itemId)
        ? currentIds.filter((id) => id !== itemId)
        : [...currentIds, itemId]
    ));
  }

  return (
    <section className="mt-8 max-w-2xl" aria-labelledby="accordion-heading">
      <h2 id="accordion-heading" className="text-2xl font-semibold">Backend-driven accordion</h2>
      <p className="mt-2 text-gray-600">
        These accordion entries are fetched from the Express API and expanded in the browser.
      </p>

      {isLoading && <p className="mt-4 text-gray-600">Loading accordion items...</p>}

      {error && !isLoading && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <div className="mt-4 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
          {items.map((item) => {
            const isOpen = openItemIds.includes(item.id);

            return (
              <div key={item.id} className="p-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 text-left font-medium text-gray-900"
                  aria-expanded={isOpen}
                  aria-controls={`${item.id}-description`}
                  onClick={() => toggleItem(item.id)}
                >
                  <span>{item.title}</span>
                  <span aria-hidden="true" className="text-xl leading-none">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <p id={`${item.id}-description`} className="mt-3 text-gray-600">
                    {item.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HomeWithAccordion() {
  return (
    <>
      <Home />
      <AccordionDemo />
    </>
  );
}

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
        <Routes>
          <Route path="/" element={<HomeWithAccordion />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
