export default function Hero() {
  return (
    <section id="hero" className="relative flex items-center justify-center py-24 sm:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6 text-center">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 ring-1 ring-blue-100">New • Next.js 14 + Tailwind</span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Build modern web apps faster
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          A minimal starter showcasing a single landing page with the App Router, TypeScript, and Tailwind CSS.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a href="#projects" className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            View Projects
          </a>
          <a href="#about" className="text-sm font-semibold leading-6 text-gray-900">
            Learn more <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
