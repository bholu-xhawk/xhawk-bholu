import Image from 'next/image';

export default function Hero() {
  return (
    <section className="mb-12">
      <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg border border-slate-200">
        <Image
          src="https://via.placeholder.com/1200x400"
          alt="Hero placeholder"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="mt-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">Welcome to My Portfolio</h2>
        <p className="mt-2 text-slate-600">Exploring web development with Next.js and Tailwind CSS.</p>
      </div>
    </section>
  );
}
