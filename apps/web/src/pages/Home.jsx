import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Home</h1>
      <p className="max-w-2xl text-gray-700">
        Explore the demo product detail page to try the responsive image carousel.
      </p>
      <Link className="inline-flex text-blue-600 hover:underline" to="/products/demo">
        View demo product
      </Link>
    </div>
  );
}
