import Image from 'next/image';

export default function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Welcome to My Portfolio</h2>
            <p className="mt-3 text-slate-600">Exploring Next.js 14 with Tailwind CSS. This is a placeholder hero section with some introductory text.</p>
          </div>
          <div className="relative h-56 md:h-64 lg:h-80">
            <Image
              src="https://via.placeholder.com/1200x400"
              alt="Hero placeholder"
              fill
              className="object-cover rounded-md shadow"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
