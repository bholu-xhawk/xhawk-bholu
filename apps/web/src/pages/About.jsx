import React from 'react';

const PUBLIC_API_LIMIT = 100;
const PUBLIC_API_WINDOW_MINUTES = 15;

export default function About() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">About</h1>
        <p className="mt-3 text-gray-700">
          This service exposes a public <code className="font-mono">/api</code> surface for health, authentication,
          and user resources.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Public API quota</h2>
        <p className="mt-2 text-gray-700">
          Public API calls are limited to {PUBLIC_API_LIMIT} requests per {PUBLIC_API_WINDOW_MINUTES}-minute fixed
          window for each client. Non-API pages do not consume this quota.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
          <li>
            <code className="font-mono">X-RateLimit-Remaining</code> is the number of requests left after the
            current request has been counted.
          </li>
          <li>
            <code className="font-mono">X-RateLimit-Reset</code> is the Unix timestamp in seconds when the current
            fixed window resets.
          </li>
          <li>
            A <code className="font-mono">429</code> response preserves both headers with a remaining value of zero.
          </li>
        </ul>
      </div>

      <div className="rounded-lg bg-blue-50 p-6 text-blue-950">
        <h2 className="text-xl font-semibold">Backoff guidance</h2>
        <p className="mt-2">
          Clients should slow down before <code className="font-mono">X-RateLimit-Remaining</code> reaches zero. After
          a <code className="font-mono">429</code>, pause requests until the epoch seconds in{' '}
          <code className="font-mono">X-RateLimit-Reset</code> have passed, then retry normally.
        </p>
      </div>
    </section>
  );
}
