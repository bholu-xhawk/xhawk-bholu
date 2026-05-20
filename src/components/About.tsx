export default function About() {
  return (
    <section id="about" className="py-20 sm:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">About this starter</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            This is a minimal Next.js 14 starter using the App Router and Tailwind CSS. It includes a simple landing page composed of reusable sections. Replace this text with your own story, mission, or product explanation.
          </p>
        </div>
        <div className="mt-10 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-gray-200 ring-2 ring-gray-300" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
